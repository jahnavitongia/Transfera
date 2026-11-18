import { useEffect, useState } from "react";
import { get } from "../services/api";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function StudentHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    get("/profile").then(({ data }) => { if (active) setProfile(data.student); })
      .catch(() => { if (active) setError("Unable to load admission status"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const ready = profile?.dateOfBirth && profile?.previousStudentId;
  const transferOpen = profile?.transferStatus === "pending";
  const cancellationOpen = ["pending", "under_review"].includes(profile?.cancellationStatus);
  const cancelled = profile?.admissionStatus === "cancelled";
  const transferAvailable = ready && !cancelled && !cancellationOpen && !transferOpen && profile.transferStatus !== "completed";
  const cancellationAvailable = ready && !cancelled && !transferOpen && !cancellationOpen;
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Student services</p><h1>Welcome, {user.name}</h1></div></header>
    {loading ? <p role="status">Loading your admission…</p> : error ? <p role="alert" className="error-message">{error}</p> : <>
      <section className="panel details-panel"><div className="section-actions"><h2>Your admission</h2><Link className="table-link" to="/dashboard/profile">{ready ? "View profile" : "Complete profile"}</Link></div>
        {ready ? <p>{profile.currentInstitution} · {profile.currentProgram} · <strong>{profile.admissionStatus}</strong></p>
          : <p>Add your previous institution and contact details before starting a request.</p>}
      </section>
      <section className="journey-grid service-cards">
        <article className="panel journey-card"><h2>Academic transfer</h2><p>{transferOpen ? "Your request is with the academic office." : "Submit completed subjects for credit review, or check a transfer decision."}</p>
          <Link className="primary-button" to={transferAvailable ? "/dashboard/transfers/new" : "/dashboard/transfers"}>{transferAvailable ? "New transfer" : "View transfer requests"}</Link>
          {transferAvailable && <Link className="table-link" to="/dashboard/transfers">Transfer history</Link>}
        </article>
        <article className="panel journey-card"><h2>Admission cancellation</h2><p>{cancellationOpen ? "Your cancellation request is awaiting a decision." : "Request cancellation of your current admission or view your receipt."}</p>
          <Link className="primary-button" to={cancellationAvailable ? "/dashboard/cancellations/new" : "/dashboard/cancellations"}>{cancellationAvailable ? "Request cancellation" : "View cancellation requests"}</Link>
          {cancellationAvailable && <Link className="table-link" to="/dashboard/cancellations">Cancellation history</Link>}
        </article>
      </section></>}
  </div>;
}
