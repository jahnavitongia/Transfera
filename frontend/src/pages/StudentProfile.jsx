import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, put } from "../services/api";
import { useAuth } from "../auth/useAuth";
const initial = { phone: "", dateOfBirth: "", previousStudentId: "", previousInstitution: "", previousProgram: "BCA", admissionYear: 2025 };
export default function StudentProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState(initial);
  const [policy, setPolicy] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    let active = true;
    get("/profile").then(({ data }) => {
      if (!active) return;
      setPolicy(data.policy);
      if (data.student) {
        const student = data.student;
        setForm({ phone: student.phone || "", dateOfBirth: student.dateOfBirth?.slice(0, 10) || "", previousStudentId: student.previousStudentId || "", previousInstitution: student.previousInstitution || "", previousProgram: student.previousProgram || "BCA", admissionYear: student.admissionYear });
        setLocked(student.transferStatus === "pending");
      }
    }).catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load profile"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const field = (name) => ({ value: form[name], onChange: event => { setForm({ ...form, [name]: event.target.value }); setSaved(false); } });
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    try { await put("/profile", form); setSaved(true); }
    catch (requestError) { setError(requestError.response?.data?.message || "Unable to save profile"); }
    finally { setBusy(false); }
  };
  if (loading) return <div className="state-card">Loading profile…</div>;
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Step 1</p><h1>Your profile</h1><p>{user.name} · {user.email}</p></div></header>
    {locked && <p className="notice">Your profile is locked while your transfer is being reviewed.</p>}
    <section className="panel"><form className="record-form profile-form" onSubmit={save}>
      <fieldset disabled={locked || busy}><legend>Personal and previous academic details</legend>
        <button type="button" className="secondary-button" onClick={() => { setForm({ phone: "9000000001", dateOfBirth: "2005-04-12", previousStudentId: "A-101", previousInstitution: "Sample College A", previousProgram: "BCA", admissionYear: 2025 }); setSaved(false); }}>Use sample profile</button>
        <div className="form-grid">
          <label>Phone<input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} {...field("phone")} /></label>
          <label>Date of birth<input type="date" required max={new Date().toISOString().slice(0, 10)} {...field("dateOfBirth")} /></label>
          <label>Previous student ID<input required {...field("previousStudentId")} /></label>
          <label>Previous institution<input required {...field("previousInstitution")} /></label>
          <label>Previous program<select {...field("previousProgram")}>{(policy?.programs || []).map(program => <option key={program}>{program}</option>)}</select></label>
          <label>Admission year<input type="number" min="2000" max={new Date().getFullYear()} required {...field("admissionYear")} /></label>
        </div>
        <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
      </fieldset>
      {error && <p role="alert" className="error-message">{error}</p>}
      {saved && <p role="status" className="success-message">Profile saved. <Link to="/dashboard/transfers/new">Continue to transfer request →</Link></p>}
    </form></section>
  </div>;
}
