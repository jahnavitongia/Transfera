import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/api";
import { useAuth } from "../auth/useAuth";
export default function Transfers() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    get("/transfers").then(({ data }) => { if (active) setRecords(data.transfers); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load transfers"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Transfer workflow</p><h1>{user.role === "student" ? "Your transfer requests" : "Transfer reviews"}</h1><p>Open a request to see subject matches and its decision.</p></div>{user.role === "student" && <Link className="primary-button" to="/dashboard/transfers/new">New transfer</Link>}</header>
    {error && <p role="alert" className="error-message">{error}</p>}
    {loading ? <div className="state-card">Loading requests…</div> : <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Request / student</th><th>Programs</th><th>Status</th><th>Approved credits</th><th>Action</th></tr></thead><tbody>{records.map(record => <tr key={record._id}><td><strong>TR-{record._id.slice(-6).toUpperCase()}</strong><small>{record.student?.name}</small></td><td>{record.previousProgram} → {record.currentProgram}</td><td><span className={`status ${record.status}`}>{record.status.replaceAll("_", " ")}</span></td><td>{record.summary.awardedCredits}</td><td><Link className="table-link" to={`/dashboard/transfers/${record._id}`}>Open request →</Link></td></tr>)}</tbody></table></div>{!records.length && <div className="empty-state"><h3>No transfer requests yet</h3></div>}</section>}
  </div>;
}
