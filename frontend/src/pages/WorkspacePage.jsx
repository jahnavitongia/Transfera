import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { get } from "../services/api";

const pageDetails = {
  transfers: { eyebrow: "Transfer operations", title: "Transfer Requests", description: "Review and manage student transfer workflows.", endpoint: "transfers" },
  subjects: { eyebrow: "Academic catalog", title: "Subjects", description: "Maintain the subjects available across programs.", endpoint: "subjects" },
  evaluations: { eyebrow: "Academic assessment", title: "Evaluations", description: "Review transfer evaluation records and outcomes.", endpoint: "transfers" },
};

const WorkspacePage = () => {
  const { pathname } = useLocation();
  const key = pathname.split("/").filter(Boolean).at(-1);
  const details = pageDetails[key];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await get(`/${details.endpoint}`);
        if (active) setRecords(response.data[details.endpoint] || []);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load this workspace.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [details.endpoint]);

  if (loading) return <div className="state-card"><div className="spinner" />Loading workspace…</div>;
  if (error) return <div className="state-card state-error"><span>!</span><h2>Something went wrong</h2><p>{error}</p></div>;

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <div><p className="eyebrow">{details.eyebrow}</p><h1>{details.title}</h1><p>{details.description}</p></div>
      </header>
      <section className="panel table-panel">
        <div className="panel-heading"><div><h2>All records</h2><span>{records.length} items</span></div></div>
        {records.length ? <div className="table-wrap"><table><thead><tr><th>Record</th><th>Status</th><th>Updated</th></tr></thead><tbody>{records.map((record) => <tr key={record._id}><td><strong>{record.student?.studentId || record.code || record.name || "Record"}</strong><small>{record.student?.name || record.program || record.currentProgram || "—"}</small></td><td><span className={`status ${record.status || "pending"}`}>{record.status || "pending"}</span></td><td>{new Date(record.updatedAt || record.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span>⌁</span><h3>No records yet</h3><p>New records will appear here.</p></div>}
      </section>
    </div>
  );
};

export default WorkspacePage;
