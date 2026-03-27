import type { CandidateScore, ParsedCandidate, ParsedJob } from './types';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;

const COMMON_SKILLS = [
  'sql',
  'python',
  'analytics',
  'product strategy',
  'stakeholder management',
  'roadmap',
  'a/b testing',
  'communication',
  'leadership',
  'figma',
  'excel'
];

function toLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractSection(lines: string[], headerKeywords: string[]): string[] {
  const idx = lines.findIndex((line) =>
    headerKeywords.some((keyword) => line.toLowerCase().includes(keyword))
  );

  if (idx < 0) return [];

  const section: string[] = [];
  for (let i = idx + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^[a-z\s]{3,}:?$/i.test(line) && !line.startsWith('-')) break;
    section.push(line.replace(/^[-•]\s*/, ''));
  }

  return section.slice(0, 8);
}

function keywordMatches(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function normalizeScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ratioScore(matches: number, total: number): number {
  if (!total) return 50;
  return normalizeScore((matches / total) * 100);
}

export function analyzeJobDescription(text: string): ParsedJob {
  const lines = toLines(text);
  const required = extractSection(lines, ['required qualifications', 'requirements']);
  const preferred = extractSection(lines, ['preferred qualifications', 'nice to have']);
  const responsibilities = extractSection(lines, ['responsibilities', 'what you will do']);
  const skills = keywordMatches(text, COMMON_SKILLS);

  return {
    jobTitle: lines[0] || 'Untitled Role',
    requiredQualifications: required,
    preferredQualifications: preferred,
    skills,
    experienceRequirements:
      required.find((item) => item.toLowerCase().includes('year')) || 'Not explicitly listed',
    educationRequirements:
      required.find((item) => /(bachelor|master|degree|education)/i.test(item)) ||
      'Not explicitly listed',
    certifications: required.filter((item) => /(cert|license|pmp|scrum)/i.test(item)),
    responsibilities,
    softSkills: keywordMatches(text, ['communication', 'collaboration', 'leadership', 'empathy'])
  };
}

export function parseCandidateText(text: string, jdText = ''): ParsedCandidate {
  const lines = toLines(text);
  const fullName = lines[0] || 'Unknown Candidate';
  const email = text.match(EMAIL_REGEX)?.[0] || '';
  const phone = text.match(PHONE_REGEX)?.[0] || '';
  const location = lines.find((line) => /,\s*[A-Z]{2}\b/.test(line)) || '';

  const education = extractSection(lines, ['education']);
  const certifications = extractSection(lines, ['certification', 'licenses']);
  const workHistory = extractSection(lines, ['experience', 'work history']);
  const skills = [
    ...new Set([
      ...extractSection(lines, ['skills', 'technical skills']).flatMap((item) => item.split(/,|\|/)),
      ...keywordMatches(text, COMMON_SKILLS)
    ])
  ]
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 20);

  const yearsDetected = [...text.matchAll(/(19|20)\d{2}/g)].map((x) => Number(x[0]));
  const yearsRelevantExperience =
    yearsDetected.length >= 2 ? Math.max(...yearsDetected) - Math.min(...yearsDetected) : 0;

  const roleAlignedKeywords = keywordMatches(`${text}\n${jdText}`, COMMON_SKILLS);
  const notableAchievements = toLines(text).filter((line) => /\d+%|increased|reduced|launched|improved/i.test(line));

  const gapsOrUnclearItems: string[] = [];
  if (!email) gapsOrUnclearItems.push('Email not detected in submitted documents.');
  if (!phone) gapsOrUnclearItems.push('Phone number not detected in submitted documents.');
  if (workHistory.length < 2) gapsOrUnclearItems.push('Work history is sparse or unclear.');

  return {
    fullName,
    email,
    phone,
    location,
    education,
    certifications,
    workHistory,
    skills,
    yearsRelevantExperience,
    roleAlignedKeywords,
    notableAchievements,
    gapsOrUnclearItems
  };
}

export function scoreCandidateAgainstJob(
  candidate: ParsedCandidate,
  job: ParsedJob,
  rawText: string
): CandidateScore {
  const reqMatches = job.requiredQualifications.filter((q) =>
    rawText.toLowerCase().includes(q.toLowerCase().slice(0, Math.min(20, q.length)))
  ).length;
  const prefMatches = job.preferredQualifications.filter((q) =>
    rawText.toLowerCase().includes(q.toLowerCase().slice(0, Math.min(20, q.length)))
  ).length;
  const skillMatches = job.skills.filter((skill) =>
    candidate.skills.join(' ').toLowerCase().includes(skill.toLowerCase())
  ).length;
  const educationHits = Number(candidate.education.length > 0) + Number(candidate.certifications.length > 0);

  const minimumQualificationsScore = ratioScore(reqMatches, job.requiredQualifications.length || 1);
  const preferredQualificationsScore = ratioScore(prefMatches, job.preferredQualifications.length || 1);
  const experienceRelevanceScore = normalizeScore(Math.min(100, candidate.yearsRelevantExperience * 12));
  const skillsRelevanceScore = ratioScore(skillMatches, job.skills.length || 1);
  const educationCertRelevanceScore = normalizeScore(educationHits * 45);
  const communicationDocumentQualityScore = normalizeScore(
    85 - candidate.gapsOrUnclearItems.length * 12 + (candidate.notableAchievements.length > 0 ? 8 : 0)
  );

  const overallFitScore = normalizeScore(
    minimumQualificationsScore * 0.28 +
      preferredQualificationsScore * 0.14 +
      experienceRelevanceScore * 0.2 +
      skillsRelevanceScore * 0.2 +
      educationCertRelevanceScore * 0.1 +
      communicationDocumentQualityScore * 0.08
  );

  const strengths = [
    skillMatches ? `Matches ${skillMatches} core role skills.` : '',
    candidate.notableAchievements.length ? 'Contains quantified achievements.' : '',
    candidate.yearsRelevantExperience >= 4 ? 'Demonstrates multiple years of relevant experience.' : ''
  ].filter(Boolean);

  const concerns = [
    !reqMatches ? 'Limited evidence for required qualifications.' : '',
    candidate.gapsOrUnclearItems.length ? candidate.gapsOrUnclearItems[0] : '',
    candidate.yearsRelevantExperience < 2 ? 'Low explicit years of documented experience.' : ''
  ].filter(Boolean);

  return {
    minimumQualificationsScore,
    preferredQualificationsScore,
    experienceRelevanceScore,
    skillsRelevanceScore,
    educationCertRelevanceScore,
    communicationDocumentQualityScore,
    overallFitScore,
    strengthsSummary: strengths.join(' '),
    concernsSummary: concerns.join(' '),
    explanations: {
      minimumQualifications: `Matched ${reqMatches}/${job.requiredQualifications.length || 1} required qualifications by direct textual evidence.`,
      preferredQualifications: `Matched ${prefMatches}/${job.preferredQualifications.length || 1} preferred qualifications from candidate materials.`,
      experienceRelevance: `Estimated ${candidate.yearsRelevantExperience} years of relevant experience from timeline references.`,
      skillsRelevance: `Matched ${skillMatches}/${job.skills.length || 1} role-aligned skills.`,
      educationCertRelevance: `Education/certification evidence count: ${educationHits}.`,
      communicationDocumentQuality: `Document clarity score reflects contact completeness, structure, and quantified outcomes.`
    }
  };
}

export function recommendationFromScore(overallFitScore: number): { type: string; rationale: string } {
  if (overallFitScore >= 85) {
    return {
      type: 'STRONGLY_RECOMMEND_INTERVIEW',
      rationale: 'Strong alignment across required qualifications, skills, and relevant experience.'
    };
  }
  if (overallFitScore >= 70) {
    return {
      type: 'RECOMMEND_INTERVIEW',
      rationale: 'Candidate meets key role requirements with manageable follow-up questions.'
    };
  }
  if (overallFitScore >= 55) {
    return {
      type: 'HOLD_FOR_REVIEW',
      rationale: 'Mixed evidence. Recruiter should perform targeted manual review before proceeding.'
    };
  }

  return {
    type: 'CONSIDER_ALTERNATE_ROLE',
    rationale: 'Current fit is limited, but profile may better match different roles or levels.'
  };
}
