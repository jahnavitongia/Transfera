import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/api";
import { useAuth } from "../auth/useAuth";
export default function Cancellations() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    get("/cancellations").then(({ data }) => { if (active) setRecords(data.cancellations); })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load cancellations"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Admission workflow</p><h1>{user.role === "student" ? "Your cancellation requests" : "Cancellation reviews"}</h1><p>Staff reviews the reason; an administrator records the final decision.</p></div>{user.role === "student" && <Link className="primary-button" to="/dashboard/cancellations/new">Request cancellation</Link>}</header>
    {error && <p role="alert" className="error-message">{error}</p>}
    {loading ? <div className="state-card">Loading requests…</div> : <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Request / student</th><th>Admission</th><th>Reason category</th><th>Status</th><th>Action</th></tr></thead><tbody>{records.map(record => <tr key={record._id}><td><strong>CA-{record._id.slice(-6).toUpperCase()}</strong><small>{record.student?.name}</small></td><td>{record.institution}<small>{record.program}</small></td><td>{record.reasonCategory}</td><td><span className={`status ${record.status}`}>{record.status.replaceAll("_", " ")}</span></td><td><Link className="table-link" to={`/dashboard/cancellations/${record._id}`}>Open request →</Link></td></tr>)}</tbody></table></div>{!records.length && <div className="empty-state"><h3>No cancellation requests yet</h3></div>}</section>}
  </div>;
}
