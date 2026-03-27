import { PrismaClient, DocumentType, InterviewStatus, RecommendationType } from '@prisma/client';
import { analyzeJobDescription, parseCandidateText, scoreCandidateAgainstJob } from '../lib/analysis';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditTrail.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.interviewResponse.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.interviewQuestion.deleteMany();
  await prisma.scorecard.deleteMany();
  await prisma.parsedCandidateProfile.deleteMany();
  await prisma.candidateDocument.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const recruiter = await prisma.user.create({
    data: { name: 'Riley Morgan', email: 'riley@recruitflow.local', role: 'Recruiter' }
  });

  const jd = `Senior Product Manager\nRequired Qualifications:\n- 5+ years product management\n- Experience with analytics and A/B testing\n- Cross-functional leadership\nPreferred Qualifications:\n- SaaS experience\n- SQL proficiency\nResponsibilities:\n- Lead roadmap\n- Partner with engineering and design\n- Drive product discovery`;

  const jobAnalysis = analyzeJobDescription(jd);

  const job = await prisma.job.create({
    data: {
      title: jobAnalysis.jobTitle || 'Senior Product Manager',
      department: 'Product',
      description: jd,
      requiredQualificationsJson: JSON.stringify(jobAnalysis.requiredQualifications),
      preferredQualificationsJson: JSON.stringify(jobAnalysis.preferredQualifications),
      skillsJson: JSON.stringify(jobAnalysis.skills),
      experienceRequirements: jobAnalysis.experienceRequirements,
      educationRequirements: jobAnalysis.educationRequirements,
      certificationsJson: JSON.stringify(jobAnalysis.certifications),
      responsibilitiesJson: JSON.stringify(jobAnalysis.responsibilities),
      softSkillsJson: JSON.stringify(jobAnalysis.softSkills),
      createdById: recruiter.id
    }
  });

  const resume = `Jordan Lee\njordan.lee@example.com\n(555) 123-4567\nSeattle, WA\n\nExperience\n2019-2025 Senior Product Manager at CloudCore\n- Led roadmap and improved activation by 18%\n- Owned experimentation with A/B testing\n- Partnered with engineering\n\nEducation\nBS Computer Science\n\nSkills\nProduct Strategy, Analytics, SQL, Stakeholder Management`;

  const parsed = parseCandidateText(resume, jd);
  const scoring = scoreCandidateAgainstJob(parsed, jobAnalysis, resume);

  const candidate = await prisma.candidate.create({
    data: {
      fullName: parsed.fullName || 'Jordan Lee',
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      positionApplied: job.title,
      jobId: job.id,
      interviewStatus: InterviewStatus.SCHEDULED,
      interviewRound: 1,
      interviewerAssigned: 'Taylor Chen',
      recruiterNotes: 'Promising PM candidate with strong experimentation background.',
      nextStep: 'Phone screen'
    }
  });

  await prisma.candidateDocument.createMany({
    data: [
      {
        candidateId: candidate.id,
        type: DocumentType.RESUME,
        fileName: 'jordan-lee-resume.txt',
        filePath: 'seed/jordan-lee-resume.txt',
        extractedText: resume,
        mimeType: 'text/plain'
      },
      {
        jobId: job.id,
        type: DocumentType.JOB_DESCRIPTION,
        fileName: 'senior-pm-jd.txt',
        filePath: 'seed/senior-pm-jd.txt',
        extractedText: jd,
        mimeType: 'text/plain'
      }
    ]
  });

  await prisma.parsedCandidateProfile.create({
    data: {
      candidateId: candidate.id,
      educationJson: JSON.stringify(parsed.education),
      certificationsJson: JSON.stringify(parsed.certifications),
      workHistoryJson: JSON.stringify(parsed.workHistory),
      skillsJson: JSON.stringify(parsed.skills),
      yearsRelevantExperience: parsed.yearsRelevantExperience,
      roleAlignedKeywordsJson: JSON.stringify(parsed.roleAlignedKeywords),
      notableAchievementsJson: JSON.stringify(parsed.notableAchievements),
      gapsOrUnclearItemsJson: JSON.stringify(parsed.gapsOrUnclearItems)
    }
  });

  await prisma.scorecard.create({
    data: {
      candidateId: candidate.id,
      minimumQualificationsScore: scoring.minimumQualificationsScore,
      preferredQualificationsScore: scoring.preferredQualificationsScore,
      experienceRelevanceScore: scoring.experienceRelevanceScore,
      skillsRelevanceScore: scoring.skillsRelevanceScore,
      educationCertRelevanceScore: scoring.educationCertRelevanceScore,
      communicationDocumentQualityScore: scoring.communicationDocumentQualityScore,
      overallFitScore: scoring.overallFitScore,
      strengthsSummary: scoring.strengthsSummary,
      concernsSummary: scoring.concernsSummary,
      explanationJson: JSON.stringify(scoring.explanations)
    }
  });

  await prisma.recommendation.create({
    data: {
      candidateId: candidate.id,
      type: RecommendationType.RECOMMEND_INTERVIEW,
      rationale: 'Candidate meets core PM requirements and has direct A/B testing impact examples.'
    }
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
