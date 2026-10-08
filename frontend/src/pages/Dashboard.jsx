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
  const [data, setData] = useState({ students: [], transfers: [], subjects: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [students, transfers, subjects] = await Promise.all([
          get("/students"), get("/transfers"), get("/subjects"),
        ]);
        if (active) setData({
          students: students.data.students || [],
          transfers: transfers.data.transfers || [],
          subjects: subjects.data.subjects || [],
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

  const pending = data.transfers.filter((item) => ["pending", "under_review"].includes(item.status)).length;
  const approved = data.transfers.filter((item) => item.status === "approved").length;
  const rejected = data.transfers.filter(item => item.status === "rejected").length;
  const recentTransfers = data.transfers.slice(0, 5);

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div><p className="eyebrow">Overview</p><h1>Welcome, {user.name}</h1><p>Here is what is happening across student transfers today.</p></div>
        <div className="live-pill"><span /> Demo workspace</div>
      </header>

      {loading ? <div className="state-card"><div className="spinner" />Loading dashboard…</div> : error ? (
        <div className="state-card state-error"><span>!</span><h2>Dashboard unavailable</h2><p>{error}</p></div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard label="Total students" value={data.students.length} tone="blue" icon="◎" />
            <StatCard label="Transfer requests" value={data.transfers.length} tone="violet" icon="↗" />
            <StatCard label="Active subjects" value={data.subjects.length} tone="green" icon="▤" />
            <StatCard label="Pending review" value={pending} tone="amber" icon="◷" />
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel-heading"><div><h2>Recent transfers</h2><span>Latest activity</span></div><Link to="/dashboard/transfers">View all →</Link></div>
              {recentTransfers.length ? <div className="transfer-list">{recentTransfers.map((transfer) => (
                <div className="transfer-row" key={transfer._id}>
                  <div className="student-avatar">{transfer.student?.studentId?.slice(0, 2).toUpperCase() || "ST"}</div>
                  <div className="transfer-details"><strong>{transfer.student?.studentId || "Student"}</strong><span>{transfer.student?.name || transfer.previousInstitution || "Transfer request"}</span></div>
                  <span className={`status ${transfer.status || "pending"}`}>{transfer.status || "pending"}</span>
                </div>
              ))}</div> : <div className="empty-state"><span>⌁</span><h3>No transfers yet</h3><p>Transfer requests will appear here.</p></div>}
            </article>

            <article className="panel status-panel">
              <div className="panel-heading"><div><h2>Transfer status</h2><span>Current queue</span></div></div>
              <div className="status-donut" style={{ "--approved": `${approved / Math.max(data.transfers.length, 1) * 360}deg`, "--pending-end": `${(approved + pending) / Math.max(data.transfers.length, 1) * 360}deg` }}>
                <div><strong>{data.transfers.length}</strong><span>Total</span></div>
              </div>
              <div className="status-legend">
                <div><span className="legend-dot approved" /><p><strong>{approved}</strong>Approved</p></div>
                <div><span className="legend-dot pending" /><p><strong>{pending}</strong>Pending / review</p></div>
              <div><span className="legend-dot rejected" /><p><strong>{rejected}</strong>Rejected</p></div></div>
            </article>
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
