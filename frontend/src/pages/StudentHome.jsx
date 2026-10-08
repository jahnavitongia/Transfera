import { useEffect, useState } from "react";
import { get } from "../services/api";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
export default function StudentHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null), [error, setError] = useState("");
  useEffect(() => { let active = true; get("/profile").then(({ data }) => { if (active) setProfile(data.student); }).catch(() => { if (active) setError("Unable to load admission status"); }); return () => { active = false; }; }, []);
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Student workspace</p><h1>Welcome, {user.name}</h1><p>Submit your academic details and follow transfer or admission cancellation requests.</p></div></header>
    {error && <p role="alert" className="error-message">{error}</p>}
    {profile && <p className="notice">Admission status: <strong>{profile.admissionStatus}</strong> · {profile.currentInstitution} · {profile.currentProgram}</p>}
    <section className="journey-grid">
      <article className="panel journey-card"><span className="step-number">1</span><h2>Your profile</h2><p>Add contact details and your previous institution.</p><Link className="primary-button" to="/dashboard/profile">Complete profile</Link></article>
      <article className="panel journey-card"><span className="step-number">2</span><h2>Request a transfer</h2><p>Choose your destination program and add completed subjects.</p><Link className="primary-button" to="/dashboard/transfers/new">New transfer</Link></article>
      <article className="panel journey-card"><span className="step-number">3</span><h2>Track the decision</h2><p>See reviewed credits, remaining subjects and the final decision.</p><Link className="primary-button" to="/dashboard/transfers">Your requests</Link></article>
      <article className="panel journey-card"><span className="step-number">4</span><h2>Cancel admission</h2><p>Submit a reason and follow staff review and the final decision.</p><Link className="primary-button" to="/dashboard/cancellations">Your cancellations</Link></article>
    </section>
  </div>;
}
