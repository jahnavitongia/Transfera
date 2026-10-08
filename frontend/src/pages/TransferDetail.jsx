import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, post, put } from "../services/api";
import { useAuth } from "../auth/useAuth";
export default function TransferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState([]);
  const [notes, setNotes] = useState("");
  const [flagsChecked, setFlagsChecked] = useState(false);
  const [decision, setDecision] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [documentText, setDocumentText] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [message, setMessage] = useState("");
  const applyRecord = value => {
    setRecord(value); setNotes(value.reviewNotes || ""); setFlagsChecked(value.recordCheck.cleared);
    setAccepted((value.evaluation?.matches || []).filter(match => ["suggested", "accepted"].includes(match.decision) && match.eligible).map(match => match.currentCode));
  };
  useEffect(() => {
    let active = true;
    get(`/transfers/${id}`).then(({ data }) => { if (active) applyRecord(data.transfer); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load request"); });
    return () => { active = false; };
  }, [id]);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  const action = async (callback, success) => {
    setBusy(true); setError(""); setMessage("");
    try { const response = await callback(); applyRecord(response.data.transfer); setMessage(success); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to complete this action"); }
    finally { setBusy(false); }
  };
  const viewTranscript = async () => {
    try {
      const { data } = await get(`/transfers/${id}/transcript`, { responseType: "blob" });
      if (data.type.includes("pdf")) { setDocumentText(null); setPdfUrl(URL.createObjectURL(data)); }
      else { setPdfUrl(null); setDocumentText(await data.text()); }
    } catch { setError("Unable to open transcript"); }
  };
  if (!record) return <div className="state-card">{error || "Loading request…"}</div>;
  const open = ["pending", "under_review"].includes(record.status);
  const reviewer = user.role !== "student";
  const matches = record.evaluation?.matches || [];
  return <div className="dashboard-page">
    <Link className="table-link" to="/dashboard/transfers">← All requests</Link>
    <header className="page-header"><div><p className="eyebrow">TR-{record._id.slice(-6).toUpperCase()}</p><h1>Transfer request</h1><p>{record.student?.name} · {record.previousProgram} → {record.currentProgram}</p></div><span className={`status large-status ${record.status}`}>{record.status.replaceAll("_", " ")}</span></header>
    {error && <p role="alert" className="error-message">{error}</p>}{message && <p role="status" className="success-message">{message}</p>}
    <section className="panel details-panel"><h2>Application details</h2><div className="form-grid"><p><strong>From:</strong> {record.previousInstitution}</p><p><strong>To:</strong> {record.destinationInstitution}</p><p><strong>Entry:</strong> Semester {record.destinationSemester}</p><p><strong>Curriculum:</strong> {record.curriculumVersion}</p></div><p><strong>Reason:</strong> {record.transferReason}</p><button className="secondary-button" onClick={viewTranscript}>View transcript</button>
      {documentText !== null && <pre className="transcript-preview">{documentText}</pre>}{pdfUrl && <iframe className="pdf-preview" title="Submitted transcript" src={pdfUrl} />}
    </section>
    {record.recordCheck.flagCount > 0 && <section className="notice"><h2>Possible duplicate record</h2><p>{record.recordCheck.cleared ? "Staff has reviewed the record flags." : "Record verification is required. This flag is not proof of fraud."}</p>{reviewer && record.duplicateFlags.map(flag => <p key={flag._id}>{flag.name}: {flag.reason}</p>)}</section>}
    <section className="panel details-panel"><div className="section-actions"><h2>Subject comparison</h2>{reviewer && open && !record.evaluation?.evaluatedAt && <button disabled={busy} className="primary-button" onClick={() => action(() => post(`/transfers/${id}/evaluate`, {}), "Comparison saved. Review the suggested matches below.")}>Compare subjects</button>}</div>
      {!record.evaluation?.evaluatedAt ? <p className="muted">Your submitted subjects are awaiting academic review. Credits have not been approved.</p> : <>
        <p className="notice">{record.evaluation.policyLabel}. Pass requirement: 4/10; completed credits must cover destination credits. Text matching suggests candidates; staff checks course content. Transfer limit: {record.evaluation.maximumTransferCredits} credits.</p>
        <div className="credit-summary"><span><strong>{record.summary.reviewedCredits}</strong> reviewed credits</span><span><strong>{record.summary.subjectsRemaining.length}</strong> subjects still required</span></div>
        <div className="table-wrap"><table className="mapping-table"><thead><tr><th>Destination requirement</th><th>Completed subject</th><th>Name similarity</th><th>Review / outcome</th></tr></thead><tbody>{matches.map(match => <tr key={match.currentCode}><td><strong>{match.currentName}</strong><small>{match.currentCode} · {match.currentCredits} credits</small><small>{match.currentTopics}</small></td><td>{match.previousName || "No candidate"}<small>{match.previousName && `${match.previousCredits} credits · grade ${match.gradePoint}/10`}</small><small>{match.previousTopics}</small></td><td>{match.similarity}%</td><td><p>{match.reason}</p>{reviewer && open ? <label className="checkbox-label"><input type="checkbox" checked={accepted.includes(match.currentCode)} disabled={!match.eligible || busy} aria-label={`Accept credit for ${match.currentName}`} onChange={event => setAccepted(current => event.target.checked ? [...current, match.currentCode] : current.filter(code => code !== match.currentCode))} />Accept credit</label> : <strong>{match.decision === "accepted" ? `${match.awardedCredits} credits ${record.status === "approved" ? "approved" : "eligible after review"}` : match.decision === "declined" || match.decision === "not_matched" ? "Still required" : "Awaiting review"}</strong>}</td></tr>)}</tbody></table></div>
        {reviewer && open && <form className="review-form" onSubmit={event => { event.preventDefault(); action(() => put(`/transfers/${id}/review`, { acceptedCodes: accepted, reviewNotes: notes, clearRecordFlags: flagsChecked }), "Review saved. The request is ready for an administrator's decision."); }}>
          <label>Staff review notes<textarea required maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Describe syllabus checks and any record verification." /></label>
          {record.recordCheck.flagCount > 0 && <label className="checkbox-label"><input type="checkbox" checked={flagsChecked} onChange={event => setFlagsChecked(event.target.checked)} />I reviewed these possible duplicate records.</label>}
          <button className="primary-button" disabled={busy}>Save academic review</button>
        </form>}
      </>}
    </section>
    {record.reviewedAt && <section className="panel details-panel"><h2>Staff review</h2><p>{record.reviewNotes}</p><p className="muted">Reviewed by {record.reviewedBy?.name || "staff"} · {new Date(record.reviewedAt).toLocaleString()}</p></section>}
    {user.role === "admin" && open && <section className="panel details-panel"><h2>Final decision</h2><form className="review-form" onSubmit={event => { event.preventDefault(); action(() => put(`/transfers/${id}/status`, { status: decision, remarks }), "Final decision recorded. The student can now see the result."); }}>
      <label>Decision<select value={decision} onChange={event => setDecision(event.target.value)}><option value="approved">Approve transfer</option><option value="rejected">Reject transfer</option></select></label>
      <label>Decision reason<textarea required maxLength={2000} value={remarks} onChange={event => setRemarks(event.target.value)} /></label>
      {decision === "approved" && !record.reviewedAt && <p className="muted">Complete academic review before approving.</p>}
      <button className="primary-button" disabled={busy || (decision === "approved" && (!record.reviewedAt || !record.summary.reviewedCredits))}>Record final decision</button>
    </form></section>}
    {!open && <section className="panel details-panel"><h2>Final decision: {record.status}</h2><p>{record.remarks}</p><p className="muted">{record.processedBy?.name || "Administrator"} · {new Date(record.decidedAt).toLocaleString()}</p><p>{record.status === "approved" ? `${record.summary.awardedCredits} credits approved for this transfer.` : "No credits have been awarded by this decision."}</p></section>}
  </div>;
}
