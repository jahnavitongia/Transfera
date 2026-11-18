export default function CourseComparison({ evaluation, canReview, busy, accepted, selections, onSelect, onAccept, approved }) {
  const semantic = evaluation.comparisonMethod === "outcome-model";
  return <div className="course-comparison">
    <p className="muted">{semantic
      ? "Ranked by similarity between syllabus outcomes. Faculty check the excerpts before recommending credit."
      : "Using course titles and aliases. Compare the submitted syllabus with each destination outcome manually."}</p>
    {evaluation.matches.map(match => {
      const chosen = match.candidates.find(item => item.previousCode === (selections[match.currentCode] || match.previousCode));
      const elsewhere = evaluation.matches.some(other => other.currentCode !== match.currentCode && accepted.includes(other.currentCode) &&
        (selections[other.currentCode] || other.previousCode) === chosen?.previousCode);
      return <article className="course-review" key={match.currentCode}>
        <header><h3>{match.currentName}</h3><span>{match.currentCode} · {match.currentCredits} credits</span></header>
        {canReview && match.candidates.length > 0 ? <label>Completed course for {match.currentName}
          <select value={chosen?.previousCode || ""} disabled={busy} onChange={event => onSelect(match.currentCode, event.target.value)}>
            {match.candidates.map(item => <option key={item.previousCode} value={item.previousCode}>{item.previousCode} · {item.previousName} ({item.similarity}% text similarity)</option>)}
          </select></label> : <p><strong>{chosen?.previousName || "No completed course"}</strong></p>}
        {chosen && <>
          <p>{chosen.previousCredits} source credits · Grade {chosen.gradePoint}/10 · {chosen.reason}</p>
          <details><summary>Compare syllabus evidence</summary>
            <div className="outcome-list">{chosen.evidence.map((row, index) => <div key={index}>
              <p><strong>Destination outcome</strong><br />{row.destination}</p>
              {semantic && row.source && <p><strong>Closest submitted excerpt</strong><br />{row.source}</p>}
              {semantic && !row.supported && <p className="muted">Gap for faculty review · Weak or missing evidence for this outcome.</p>}
            </div>)}</div>
            <p><strong>Full submitted syllabus entry</strong><br />{chosen.previousTopics}</p>
          </details>
        </>}
        {canReview ? <><label className="checkbox-label"><input type="checkbox" checked={accepted.includes(match.currentCode)}
          disabled={busy || !chosen?.eligible || elsewhere} aria-label={`Accept credit for ${match.currentName}`}
          onChange={event => onAccept(match.currentCode, event.target.checked)} />Accept credit</label>
          {elsewhere && <small>This source is already selected for another requirement.</small>}</> :
          <p><strong>{match.decision === "accepted" ? `${match.awardedCredits} credits ${approved ? "approved" : "recommended"}` :
            match.decision === "declined" ? "Still required" : "Awaiting faculty review"}</strong></p>}
      </article>;
    })}
  </div>;
}
