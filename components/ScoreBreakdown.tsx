export function ScoreBreakdown({ scorecard }: { scorecard: any }) {
  if (!scorecard) {
    return <p className="small">No scorecard yet.</p>;
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <h3>Overall Fit Score</h3>
        <p className="score">{scorecard.overallFitScore}/100</p>
      </div>
      <div className="card">
        <h3>Breakdown</h3>
        <ul>
          <li>Required Qualifications: {scorecard.minimumQualificationsScore}</li>
          <li>Preferred Qualifications: {scorecard.preferredQualificationsScore}</li>
          <li>Experience: {scorecard.experienceRelevanceScore}</li>
          <li>Skills: {scorecard.skillsRelevanceScore}</li>
          <li>Education/Certifications: {scorecard.educationCertRelevanceScore}</li>
          <li>Communication/Document Quality: {scorecard.communicationDocumentQualityScore}</li>
        </ul>
      </div>
    </div>
  );
}
