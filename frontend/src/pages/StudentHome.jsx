import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
export default function StudentHome() {
  const { user } = useAuth();
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Student workspace</p><h1>Welcome, {user.name}</h1><p>Submit your academic details and follow your transfer request.</p></div></header>
    <section className="journey-grid">
      <article className="panel journey-card"><span className="step-number">1</span><h2>Your profile</h2><p>Add contact details and your previous institution.</p><Link className="primary-button" to="/dashboard/profile">Complete profile</Link></article>
      <article className="panel journey-card"><span className="step-number">2</span><h2>Request a transfer</h2><p>Choose your destination program and add completed subjects.</p><Link className="primary-button" to="/dashboard/transfers/new">New transfer</Link></article>
      <article className="panel journey-card"><span className="step-number">3</span><h2>Track the decision</h2><p>See reviewed credits, remaining subjects and the final decision.</p><Link className="primary-button" to="/dashboard/transfers">Your requests</Link></article>
    </section>
  </div>;
}
