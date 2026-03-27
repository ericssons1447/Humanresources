import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { toCsv, toXlsxBuffer } from '@/lib/export';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'csv';
  type CandidateWithExportRelations = Prisma.CandidateGetPayload<{
    include: {
      job: true;
      documents: true;
      scorecard: true;
      recommendations: { orderBy: { createdAt: 'desc' }; take: 1 };
    };
  }>;

  const candidates = await prisma.candidate.findMany({
    include: {
      job: true,
      documents: true,
      scorecard: true,
      recommendations: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  const rows = candidates.map((candidate: CandidateWithExportRelations) => ({
    candidateName: candidate.fullName,
    position: candidate.positionApplied,
    applicationDate: candidate.applicationDate.toISOString().slice(0, 10),
    resumeUploaded: candidate.documents.some((d) => d.type === 'RESUME') ? 'Yes' : 'No',
    coverLetterUploaded: candidate.documents.some((d) => d.type === 'COVER_LETTER') ? 'Yes' : 'No',
    supportingDocumentsUploaded: candidate.documents.filter((d) => d.type === 'SUPPORTING').length,
    requiredQualificationsScore: candidate.scorecard?.minimumQualificationsScore ?? '',
    preferredQualificationsScore: candidate.scorecard?.preferredQualificationsScore ?? '',
    experienceScore: candidate.scorecard?.experienceRelevanceScore ?? '',
    skillsScore: candidate.scorecard?.skillsRelevanceScore ?? '',
    educationCertScore: candidate.scorecard?.educationCertRelevanceScore ?? '',
    overallFitScore: candidate.scorecard?.overallFitScore ?? '',
    strengthsSummary: candidate.scorecard?.strengthsSummary ?? '',
    concernsSummary: candidate.scorecard?.concernsSummary ?? '',
    recommendation: candidate.recommendations[0]?.type ?? '',
    interviewStatus: candidate.interviewStatus,
    interviewRound: candidate.interviewRound,
    interviewerAssigned: candidate.interviewerAssigned ?? '',
    interviewScore: candidate.interviewScore ?? '',
    finalDecision: candidate.finalDecision ?? '',
    recruiterNotes: candidate.recruiterNotes ?? '',
    hiringManagerNotes: candidate.hiringManagerNotes ?? '',
    nextStep: candidate.nextStep ?? '',
    decisionDate: candidate.decisionDate?.toISOString().slice(0, 10) ?? ''
  }));

  if (format === 'xlsx') {
    const buffer = toXlsxBuffer(rows);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="recruitflow-candidates.xlsx"'
      }
    });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="recruitflow-candidates.csv"'
    }
  });
}
