'use client';

import { useEffect, useState } from 'react';

type Candidate = {
  id: string;
  fullName: string;
  positionApplied: string;
  applicationDate: string;
  documents: { type: string }[];
  scorecard?: {
    minimumQualificationsScore: number;
    preferredQualificationsScore: number;
    experienceRelevanceScore: number;
    skillsRelevanceScore: number;
    educationCertRelevanceScore: number;
    overallFitScore: number;
    strengthsSummary: string;
    concernsSummary: string;
  };
  recommendations: { type: string }[];
  interviewStatus: string;
  interviewRound: number;
  interviewerAssigned: string | null;
  interviewScore: number | null;
  finalDecision: string | null;
  recruiterNotes: string | null;
  hiringManagerNotes: string | null;
  nextStep: string | null;
  decisionDate: string | null;
};

export default function CandidateListPage() {
  const [records, setRecords] = useState<Candidate[]>([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score'>('score');

  useEffect(() => {
    fetch('/api/candidates')
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => setRecords([]));
  }, []);

  const filtered = records
    .filter((row) => row.fullName.toLowerCase().includes(query.toLowerCase()) || row.positionApplied.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      return (b.scorecard?.overallFitScore ?? 0) - (a.scorecard?.overallFitScore ?? 0);
    });

  return (
    <div className="card">
      <h2>Candidate Tracking Table</h2>
      <div className="grid grid-2">
        <label>
          Filter
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name/position" />
        </label>
        <label>
          Sort By
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'score')}>
            <option value="score">Overall Fit Score</option>
            <option value="name">Candidate Name</option>
          </select>
        </label>
      </div>

      <p className="small">
        Export: <a href="/api/export?format=csv">CSV</a> · <a href="/api/export?format=xlsx">Excel (.xlsx)</a>
      </p>

      <table>
        <thead>
          <tr>
            <th>Candidate</th><th>Position</th><th>Application Date</th><th>Resume</th><th>Cover Letter</th><th>Supporting</th>
            <th>Req Score</th><th>Pref Score</th><th>Exp</th><th>Skills</th><th>Edu/Cert</th><th>Overall</th>
            <th>Strengths</th><th>Concerns</th><th>Recommendation</th><th>Interview Status</th><th>Round</th><th>Interviewer</th>
            <th>Interview Score</th><th>Final Decision</th><th>Recruiter Notes</th><th>Hiring Mgr Notes</th><th>Next Step</th><th>Decision Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((candidate) => {
            const docs = candidate.documents.map((d) => d.type);
            return (
              <tr key={candidate.id}>
                <td><a href={`/candidates/${candidate.id}`}>{candidate.fullName}</a></td>
                <td>{candidate.positionApplied}</td>
                <td>{new Date(candidate.applicationDate).toLocaleDateString()}</td>
                <td>{docs.includes('RESUME') ? 'Yes' : 'No'}</td>
                <td>{docs.includes('COVER_LETTER') ? 'Yes' : 'No'}</td>
                <td>{docs.filter((x) => x === 'SUPPORTING').length}</td>
                <td>{candidate.scorecard?.minimumQualificationsScore ?? '-'}</td>
                <td>{candidate.scorecard?.preferredQualificationsScore ?? '-'}</td>
                <td>{candidate.scorecard?.experienceRelevanceScore ?? '-'}</td>
                <td>{candidate.scorecard?.skillsRelevanceScore ?? '-'}</td>
                <td>{candidate.scorecard?.educationCertRelevanceScore ?? '-'}</td>
                <td><strong>{candidate.scorecard?.overallFitScore ?? '-'}</strong></td>
                <td>{candidate.scorecard?.strengthsSummary ?? '-'}</td>
                <td>{candidate.scorecard?.concernsSummary ?? '-'}</td>
                <td>{candidate.recommendations[0]?.type ?? '-'}</td>
                <td>{candidate.interviewStatus}</td>
                <td>{candidate.interviewRound}</td>
                <td>{candidate.interviewerAssigned ?? '-'}</td>
                <td>{candidate.interviewScore ?? '-'}</td>
                <td>{candidate.finalDecision ?? '-'}</td>
                <td>{candidate.recruiterNotes ?? '-'}</td>
                <td>{candidate.hiringManagerNotes ?? '-'}</td>
                <td>{candidate.nextStep ?? '-'}</td>
                <td>{candidate.decisionDate ? new Date(candidate.decisionDate).toLocaleDateString() : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
