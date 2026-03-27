export default function ExportReportPage() {
  return (
    <div className="card">
      <h2>Export / Reporting (Phase 3 scaffold)</h2>
      <p>Download candidate tracker reports:</p>
      <ul>
        <li><a href="/api/export?format=csv">Export CSV</a></li>
        <li><a href="/api/export?format=xlsx">Export Excel (.xlsx)</a></li>
      </ul>
      <p className="small">Unfinished: richer report bundles, score change history report, and additional compliance analytics are planned for Phase 3.</p>
    </div>
  );
}
