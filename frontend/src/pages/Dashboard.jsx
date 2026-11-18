import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/api";
import { useAuth } from "../auth/useAuth";

const StatCard = ({ label, value, tone, icon }) => (
  <article className={`stat-card ${tone}`}>
    <div className="stat-icon">{icon}</div>
    <div><span>{label}</span><strong>{value}</strong></div>
  </article>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ students: [], transfers: [], cancellations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [students, transfers, cancellations] = await Promise.all([
          get("/students"), get("/transfers"), get("/cancellations"),
        ]);
        if (active) setData({
          students: students.data.students || [],
          transfers: transfers.data.transfers || [],
          cancellations: cancellations.data.cancellations || [],
        });
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadData();
    return () => { active = false; };
  }, []);

  const admin = user.role === "admin";
  const active = [
    ...data.transfers.map(record => ({ record, type: "Transfer", path: "transfers" })),
    ...data.cancellations.map(record => ({ record, type: "Cancellation", path: "cancellations" })),
  ].filter(({ record }) => ["pending", "under_review"].includes(record.status));
  const queue = active.filter(({ record }) => admin ? Boolean(record.reviewedAt) : !record.reviewedAt)
    .sort((a, b) => new Date(a.record.createdAt) - new Date(b.record.createdAt));

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div><p className="eyebrow">MIT School of Computing · Pilot</p><h1>{admin ? "Academic decisions" : "Faculty review"}</h1><p>{admin ? "Requests with a recorded staff recommendation are ready for a decision." : "Open a student request to check the evidence and record your recommendation."}</p></div>
      </header>

      {loading ? <div className="state-card"><div className="spinner" />Loading dashboard…</div> : error ? (
        <div className="state-card state-error"><span>!</span><h2>Dashboard unavailable</h2><p>{error}</p></div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard label="Total students" value={data.students.length} tone="blue" icon="◎" />
            <StatCard label="Transfer requests" value={data.transfers.length} tone="violet" icon="↗" />
            <StatCard label="Cancellation requests" value={data.cancellations.length} tone="green" icon="▤" />
            <StatCard label={admin ? "Ready for decision" : "Awaiting faculty"} value={queue.length} tone="amber" icon="◷" />
          </section>

          <section className="panel details-panel"><h2>{admin ? "Ready for decision" : "Awaiting faculty review"}</h2>
            {queue.length ? <ul className="review-queue">{queue.map(({ record, type, path }) =>
              <li key={record._id}><div><strong>{record.student?.name || "Student"}</strong>
                <p>{type} · {record.currentProgram || record.program}</p></div>
                <Link className="table-link" to={`/dashboard/${path}/${record._id}`} aria-label={`Open ${type.toLowerCase()} for ${record.student?.name || "student"}`}>Open request →</Link></li>
            )}</ul> : <p>No requests are waiting in this queue.</p>}
            <div className="step-actions"><Link className="table-link" to="/dashboard/transfers">All transfers</Link><Link className="table-link" to="/dashboard/cancellations">All cancellations</Link></div>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
