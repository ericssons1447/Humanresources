import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RecruitFlow AI',
  description: 'ATS-lite and interview support for recruiters and hiring teams.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div>
            <h1>RecruitFlow AI</h1>
            <p className="subtitle">ATS-lite + interview support system</p>
          </div>
          <nav>
            <Link href="/">Dashboard</Link>
            <Link href="/jobs/new">New Job</Link>
            <Link href="/candidates/new">Candidate Upload</Link>
            <Link href="/candidates">Candidates</Link>
            <Link href="/interviews">Interview Workspace</Link>
            <Link href="/export">Export</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
