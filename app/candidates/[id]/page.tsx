import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ComplianceNotice } from '@/components/ComplianceNotice';
import { ScoreBreakdown } from '@/components/ScoreBreakdown';

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: {
      job: true,
      documents: true,
      parsedProfile: true,
      scorecard: true,
      recommendations: { orderBy: { createdAt: 'desc' } },
      auditTrails: { orderBy: { createdAt: 'desc' }, take: 10 }
    }
  });

  if (!candidate) return notFound();

  const profile = candidate.parsedProfile;
  const explanations = candidate.scorecard?.explanationJson
    ? (JSON.parse(candidate.scorecard.explanationJson) as Record<string, string>)
    : {};

  return (
    <div>
      <ComplianceNotice />
      <section className="card">
        <h2>{candidate.fullName}</h2>
        <p className="small">{candidate.positionApplied}</p>
        <p>Email: {candidate.email || 'N/A'} · Phone: {candidate.phone || 'N/A'} · Location: {candidate.location || 'N/A'}</p>
        <p>Current recommendation: <span className="badge">{candidate.recommendations[0]?.type || 'Pending manual review'}</span></p>
        <p className="small">Rationale: {candidate.recommendations[0]?.rationale || 'No recommendation yet.'}</p>
      </section>

      <ScoreBreakdown scorecard={candidate.scorecard} />

      <section className="card">
        <h3>Score Explanations</h3>
        <ul>
          {Object.entries(explanations).map(([key, value]) => (
            <li key={key}><strong>{key}</strong>: {value}</li>
          ))}
        </ul>
        <p><strong>Strengths:</strong> {candidate.scorecard?.strengthsSummary || 'N/A'}</p>
        <p><strong>Concerns:</strong> {candidate.scorecard?.concernsSummary || 'N/A'}</p>
      </section>

      <section className="card grid grid-2">
        <div>
          <h3>Parsed Candidate Profile</h3>
          <p><strong>Education:</strong> {parseJsonArray(profile?.educationJson).join('; ') || 'N/A'}</p>
          <p><strong>Certifications:</strong> {parseJsonArray(profile?.certificationsJson).join('; ') || 'N/A'}</p>
          <p><strong>Work History:</strong> {parseJsonArray(profile?.workHistoryJson).join('; ') || 'N/A'}</p>
          <p><strong>Skills:</strong> {parseJsonArray(profile?.skillsJson).join(', ') || 'N/A'}</p>
          <p><strong>Years Relevant Experience:</strong> {profile?.yearsRelevantExperience ?? 'N/A'}</p>
          <p><strong>Role-Aligned Keywords:</strong> {parseJsonArray(profile?.roleAlignedKeywordsJson).join(', ') || 'N/A'}</p>
          <p><strong>Notable Achievements:</strong> {parseJsonArray(profile?.notableAchievementsJson).join('; ') || 'N/A'}</p>
          <p><strong>Gaps / Unclear Items:</strong> {parseJsonArray(profile?.gapsOrUnclearItemsJson).join('; ') || 'N/A'}</p>
        </div>
        <div>
          <h3>Job Description Analysis</h3>
          <p><strong>Job title:</strong> {candidate.job.title}</p>
          <p><strong>Required Qualifications</strong></p>
          <ul>{parseJsonArray(candidate.job.requiredQualificationsJson).map((q) => <li key={q}>{q}</li>)}</ul>
          <p><strong>Preferred Qualifications</strong></p>
          <ul>{parseJsonArray(candidate.job.preferredQualificationsJson).map((q) => <li key={q}>{q}</li>)}</ul>
          <p><strong>Skills:</strong> {parseJsonArray(candidate.job.skillsJson).join(', ') || 'N/A'}</p>
          <p><strong>Responsibilities:</strong> {parseJsonArray(candidate.job.responsibilitiesJson).join('; ') || 'N/A'}</p>
          <p><strong>Soft skills signals:</strong> {parseJsonArray(candidate.job.softSkillsJson).join(', ') || 'N/A'}</p>
        </div>
      </section>

      <section className="card">
        <h3>Audit Trail (MVP)</h3>
        <ul>
          {candidate.auditTrails.map((item) => (
            <li key={item.id}>{item.createdAt.toISOString()} · {item.actor} · {item.action} · {item.field}: {item.oldValue || '∅'} → {item.newValue || '∅'}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
