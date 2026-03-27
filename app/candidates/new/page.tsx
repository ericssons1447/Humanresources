'use client';

import { useEffect, useState } from 'react';
import { ComplianceNotice } from '@/components/ComplianceNotice';

type Job = { id: string; title: string; department: string | null };

export default function CandidateUploadPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => setStatus('Unable to load jobs.'));
  }, []);

  async function submitCandidate(formData: FormData) {
    setStatus('Uploading and analyzing candidate...');
    const response = await fetch('/api/candidates', { method: 'POST', body: formData });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error || 'Upload failed.');
      return;
    }
    setStatus('Candidate uploaded, parsed, and scored.');
  }

  return (
    <div className="card">
      <h2>Candidate Document Intake</h2>
      <ComplianceNotice />
      <form action={submitCandidate} style={{ marginTop: '1rem' }}>
        <label>
          Select Job
          <select name="jobId" required>
            <option value="">Select a job...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}{job.department ? ` · ${job.department}` : ''}</option>
            ))}
          </select>
        </label>

        <label>
          Resume (required)
          <input type="file" name="resume" required accept=".pdf,.docx,.txt" />
        </label>

        <label>
          Cover Letter
          <input type="file" name="coverLetter" accept=".pdf,.docx,.txt" />
        </label>

        <label>
          Supporting Documents (optional, multiple)
          <input type="file" name="supportingDocs" multiple accept=".pdf,.docx,.txt" />
        </label>

        <button type="submit">Upload and Score Candidate</button>
      </form>
      <p className="small">{status}</p>
    </div>
  );
}
