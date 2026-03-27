'use client';

import { useState } from 'react';
import { ComplianceNotice } from '@/components/ComplianceNotice';

export default function NewJobPage() {
  const [status, setStatus] = useState('');

  async function handleSubmit(formData: FormData) {
    setStatus('Submitting...');
    const response = await fetch('/api/jobs', { method: 'POST', body: formData });
    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error || 'Failed to create job.');
      return;
    }

    setStatus('Job created successfully.');
  }

  return (
    <div className="card">
      <h2>New Job Posting / Job Description</h2>
      <ComplianceNotice />
      <form action={handleSubmit} style={{ marginTop: '1rem' }}>
        <label>
          Job Title
          <input name="title" placeholder="Senior Product Manager" required />
        </label>

        <label>
          Department
          <input name="department" placeholder="Product" />
        </label>

        <label>
          Paste Job Description
          <textarea name="description" rows={10} placeholder="Paste full job description here..." />
        </label>

        <label>
          Or Upload Job Description File (PDF/DOCX/TXT)
          <input type="file" name="jobDescriptionFile" accept=".pdf,.docx,.txt" />
        </label>

        <button type="submit">Analyze and Save Job</button>
      </form>
      <p className="small">{status}</p>
    </div>
  );
}
