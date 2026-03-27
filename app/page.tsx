import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ComplianceNotice } from '@/components/ComplianceNotice';

export default async function DashboardPage() {
  const [jobs, candidates] = await Promise.all([
    prisma.job.count(),
    prisma.candidate.findMany({ include: { scorecard: true }, orderBy: { createdAt: 'desc' }, take: 5 })
  ]);

  return (
    <div>
      <ComplianceNotice />
      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        <section className="card">
          <h2>Dashboard</h2>
          <p>Open jobs: {jobs}</p>
          <p>Total candidates: {candidates.length}</p>
          <p className="small">Phase 1 MVP: intake, parsing, scoring, and recruiter table.</p>
        </section>
        <section className="card">
          <h2>Quick Actions</h2>
          <ul>
            <li><Link href="/jobs/new">Create a new job posting</Link></li>
            <li><Link href="/candidates/new">Upload candidate materials</Link></li>
            <li><Link href="/candidates">Review candidate table</Link></li>
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Recent Candidates</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Overall Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td><Link href={`/candidates/${candidate.id}`}>{candidate.fullName}</Link></td>
                <td>{candidate.positionApplied}</td>
                <td>{candidate.scorecard?.overallFitScore ?? '-'}</td>
                <td>{candidate.interviewStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
