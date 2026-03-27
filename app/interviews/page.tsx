import { prisma } from '@/lib/prisma';

export default async function InterviewWorkspacePage() {
  const candidates = await prisma.candidate.findMany({
    include: {
      interviewSessions: { include: { responses: true } },
      recommendations: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="card">
      <h2>Interview Workspace (Phase 2 scaffold)</h2>
      <p className="small">This page is scaffolded for multi-round interviewer input and AI-generated question workflow.</p>
      <table>
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Round</th>
            <th>Status</th>
            <th>Interviewer</th>
            <th>Latest Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td>{candidate.fullName}</td>
              <td>{candidate.interviewRound}</td>
              <td>{candidate.interviewStatus}</td>
              <td>{candidate.interviewerAssigned || '-'}</td>
              <td>{candidate.recommendations[0]?.type || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small">Unfinished: personalized interview question generation and response capture forms are scheduled for Phase 2.</p>
    </div>
  );
}
