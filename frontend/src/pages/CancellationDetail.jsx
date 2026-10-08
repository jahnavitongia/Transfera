import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, put } from "../services/api";
import { useAuth } from "../auth/useAuth";
export default function CancellationDetail() {
  const { id } = useParams(), { user } = useAuth();
  const [record, setRecord] = useState(null), [error, setError] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [recommendation, setRecommendation] = useState("approved"), [notes, setNotes] = useState("");
  const [decision, setDecision] = useState("approved"), [reason, setReason] = useState("");
  useEffect(() => {
    let active = true;
    get(`/cancellations/${id}`).then(({ data }) => { if (active) { setRecord(data.cancellation); setNotes(data.cancellation.reviewNotes || ""); setRecommendation(data.cancellation.recommendation || "approved"); setDecision(data.cancellation.recommendation || "approved"); } })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load request"); });
    return () => { active = false; };
  }, [id]);
  const action = async (url, body, success) => {
    setBusy(true); setError(""); setMessage("");
    try { const { data } = await put(url, body); setRecord(data.cancellation); setMessage(success); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to complete this action"); }
    finally { setBusy(false); }
  };
  if (!record) return <div className="state-card">{error || "Loading request…"}</div>;
  const open = ["pending", "under_review"].includes(record.status);
  return <div className="dashboard-page">
    <Link className="table-link" to="/dashboard/cancellations">← All cancellations</Link>
    <header className="page-header"><div><p className="eyebrow">CA-{record._id.slice(-6).toUpperCase()}</p><h1>Cancellation request</h1><p>{record.student?.name} · {record.program}</p></div><span className={`status large-status ${record.status}`}>{record.status.replaceAll("_", " ")}</span></header>
    {error && <p role="alert" className="error-message">{error}</p>}{message && <p role="status" className="success-message">{message}</p>}
    <section className="panel details-panel"><h2>Application details</h2><p><strong>Admission:</strong> {record.institution} · {record.program}</p><p><strong>Category:</strong> {record.reasonCategory}</p><p><strong>Student reason:</strong> {record.reason}</p><p className="muted">Submitted {new Date(record.createdAt).toLocaleString()} · Student acknowledged the effect of approval.</p></section>
    {open && <p className="notice">Admission remains unchanged while this request is being reviewed.</p>}
    {user.role !== "student" && open && <section className="panel details-panel"><h2>Staff review</h2><form className="review-form" onSubmit={event => { event.preventDefault(); action(`/cancellations/${id}/review`, { recommendation, reviewNotes: notes }, "Staff review saved. An administrator can record the final decision."); }}>
      <label>Staff recommendation<select value={recommendation} onChange={event => setRecommendation(event.target.value)}><option value="approved">Recommend approval</option><option value="rejected">Recommend rejection</option></select></label>
      <label>Staff review notes<textarea required maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record admission and reason checks for this sample workflow." /></label>
      <button className="primary-button" disabled={busy}>Save cancellation review</button>
    </form></section>}
    {record.reviewedAt && <section className="panel details-panel"><h2>Recorded staff review</h2><p>Recommendation: {record.recommendation === "approved" ? "Approve" : "Reject"}</p><p>{record.reviewNotes}</p><p className="muted">{record.reviewedBy?.name} · {new Date(record.reviewedAt).toLocaleString()}</p></section>}
    {user.role === "admin" && open && <section className="panel details-panel"><h2>Final decision</h2><form className="review-form" onSubmit={event => { event.preventDefault(); action(`/cancellations/${id}/status`, { status: decision, decisionReason: reason }, "Final decision recorded. The student can now see the result."); }}>
      <label>Decision<select aria-label="Decision" value={decision} onChange={event => setDecision(event.target.value)}><option value="approved">Approve cancellation</option><option value="rejected">Reject cancellation</option></select></label>
      <label>Decision reason<textarea required maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /></label>
      {!record.reviewedAt && <p className="muted">Complete staff review before deciding.</p>}
      <button className="primary-button" disabled={busy || !record.reviewedAt}>Record final decision</button>
    </form></section>}
    {!open && <section className="panel details-panel"><h2>Final decision: {record.status}</h2><p>{record.status === "approved" ? "This admission is now cancelled." : "This cancellation was rejected. Your admission remains unchanged."}</p><p>{record.decisionReason}</p><p className="muted">{record.processedBy?.name} · {new Date(record.decidedAt).toLocaleString()}</p></section>}
  </div>;
}
