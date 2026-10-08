import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "../services/api";
export default function NewCancellation() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null), [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("Personal circumstances"), [reason, setReason] = useState(""), [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([get("/profile"), get("/cancellations")]).then(([student, requests]) => {
      if (active) { setProfile(student.data.student); setCategories(requests.data.categories); }
    }).catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load admission details"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError("");
    try { const { data } = await post("/cancellations", { reasonCategory: category, reason, acknowledged }); navigate(`/dashboard/cancellations/${data.cancellation._id}`); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to submit cancellation"); }
    finally { setBusy(false); }
  };
  if (loading) return <div className="state-card">Loading admission…</div>;
  if (error && !profile) return <div role="alert" className="state-card">{error}</div>;
  if (!profile?.dateOfBirth || !profile.previousStudentId) return <div className="state-card">Complete <Link to="/dashboard/profile">your profile</Link> before requesting cancellation.</div>;
  if (profile.admissionStatus === "cancelled") return <div className="state-card"><h1>Admission cancelled</h1><p>Your cancellation has already been approved. <Link to="/dashboard/cancellations">View the decision →</Link></p></div>;
  if (profile.transferStatus === "pending" || ["pending", "under_review"].includes(profile.cancellationStatus)) return <div className="state-card"><h1>Request already in progress</h1><p>Complete your active request first.</p><Link to={profile.transferStatus === "pending" ? "/dashboard/transfers" : "/dashboard/cancellations"}>View your request →</Link></div>;
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Admission workflow</p><h1>Request admission cancellation</h1><p>{profile.name} · {profile.currentInstitution} · {profile.currentProgram}</p></div></header>
    <p className="notice">Submitting a request keeps your admission unchanged. It becomes cancelled only after staff review and administrator approval. This demo records the decision; fee refunds and document clearance require institutional rules.</p>
    <form className="panel record-form" onSubmit={submit}><fieldset disabled={busy}><legend>Cancellation reason</legend>
      <label>Reason category<select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Reason for cancellation<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Explain why you wish to cancel this admission." /></label>
      <button type="button" className="secondary-button" onClick={() => { setCategory("Personal circumstances"); setReason("Fictional demo: personal relocation prevents me from continuing this admission."); }}>Use sample reason</button>
      <label className="checkbox-label"><input type="checkbox" required checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />I understand that approval will cancel this admission.</label>
      <button className="primary-button" disabled={busy || !acknowledged}>{busy ? "Submitting…" : "Submit cancellation request"}</button>
    </fieldset>{error && <p role="alert" className="error-message">{error}</p>}</form>
  </div>;
}
