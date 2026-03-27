import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  analyzeJobDescription,
  parseCandidateText,
  recommendationFromScore,
  scoreCandidateAgainstJob
} from '@/lib/analysis';
import { extractTextFromFile, persistUploadedFile } from '@/lib/file';

export const runtime = 'nodejs';

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    include: {
      job: true,
      documents: true,
      scorecard: true,
      recommendations: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(candidates);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const jobId = String(formData.get('jobId') || '');
  const resume = formData.get('resume') as File | null;
  const coverLetter = formData.get('coverLetter') as File | null;
  const supportingDocs = formData.getAll('supportingDocs') as File[];

  if (!jobId || !resume) {
    return NextResponse.json({ error: 'jobId and resume are required.' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
  }

  const docPayloads: {
    type: 'RESUME' | 'COVER_LETTER' | 'SUPPORTING';
    fileName: string;
    filePath: string;
    mimeType: string;
    extractedText: string;
  }[] = [];

  async function handleFile(file: File, type: 'RESUME' | 'COVER_LETTER' | 'SUPPORTING') {
    if (!file || file.size === 0) return '';
    const persisted = await persistUploadedFile(file, type.toLowerCase());
    const extractedText = await extractTextFromFile(file.name, file.type, persisted.buffer);
    docPayloads.push({
      type,
      fileName: persisted.fileName,
      filePath: persisted.fullPath,
      mimeType: file.type || 'application/octet-stream',
      extractedText
    });
    return extractedText;
  }

  const resumeText = await handleFile(resume, 'RESUME');
  const coverLetterText = coverLetter ? await handleFile(coverLetter, 'COVER_LETTER') : '';

  for (const file of supportingDocs) {
    if (file.size > 0) {
      await handleFile(file, 'SUPPORTING');
    }
  }

  const sourceText = [resumeText, coverLetterText, ...docPayloads.map((d) => d.extractedText)].join('\n\n');
  const jobAnalysis = analyzeJobDescription(job.description);
  const parsed = parseCandidateText(sourceText, job.description);
  const scores = scoreCandidateAgainstJob(parsed, jobAnalysis, sourceText);
  const recommendation = recommendationFromScore(scores.overallFitScore);

  const candidate = await prisma.candidate.create({
    data: {
      fullName: parsed.fullName,
      email: parsed.email || null,
      phone: parsed.phone || null,
      location: parsed.location || null,
      positionApplied: job.title,
      jobId: job.id,
      interviewStatus: 'NOT_STARTED',
      interviewRound: 0,
      documents: {
        create: docPayloads
      },
      parsedProfile: {
        create: {
          educationJson: JSON.stringify(parsed.education),
          certificationsJson: JSON.stringify(parsed.certifications),
          workHistoryJson: JSON.stringify(parsed.workHistory),
          skillsJson: JSON.stringify(parsed.skills),
          yearsRelevantExperience: parsed.yearsRelevantExperience,
          roleAlignedKeywordsJson: JSON.stringify(parsed.roleAlignedKeywords),
          notableAchievementsJson: JSON.stringify(parsed.notableAchievements),
          gapsOrUnclearItemsJson: JSON.stringify(parsed.gapsOrUnclearItems)
        }
      },
      scorecard: {
        create: {
          minimumQualificationsScore: scores.minimumQualificationsScore,
          preferredQualificationsScore: scores.preferredQualificationsScore,
          experienceRelevanceScore: scores.experienceRelevanceScore,
          skillsRelevanceScore: scores.skillsRelevanceScore,
          educationCertRelevanceScore: scores.educationCertRelevanceScore,
          communicationDocumentQualityScore: scores.communicationDocumentQualityScore,
          overallFitScore: scores.overallFitScore,
          strengthsSummary: scores.strengthsSummary,
          concernsSummary: scores.concernsSummary,
          explanationJson: JSON.stringify(scores.explanations)
        }
      },
      recommendations: {
        create: {
          type: recommendation.type as
            | 'STRONGLY_RECOMMEND_INTERVIEW'
            | 'RECOMMEND_INTERVIEW'
            | 'HOLD_FOR_REVIEW'
            | 'CONSIDER_ALTERNATE_ROLE',
          rationale: recommendation.rationale
        }
      },
      auditTrails: {
        create: {
          action: 'CREATE_CANDIDATE',
          field: 'scorecard.overallFitScore',
          oldValue: null,
          newValue: String(scores.overallFitScore),
          actor: 'system'
        }
      }
    },
    include: {
      job: true,
      documents: true,
      parsedProfile: true,
      scorecard: true,
      recommendations: true
    }
  });

  return NextResponse.json(candidate, { status: 201 });
}
