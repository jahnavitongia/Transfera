import { useEffect, useState } from "react";
import { get } from "../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadStudents = async () => {
      try {
        const response = await get("/students");
        if (active) setStudents(response.data.students || []);
      } catch (requestError) {
        if (active) setError(requestError.response?.data?.message || "Unable to load students.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadStudents();
    return () => { active = false; };
  }, []);

  return (
    <div className="dashboard-page">
      <header className="page-header"><div><p className="eyebrow">Student records</p><h1>Students</h1><p>Manage all registered student profiles.</p></div></header>
      {loading ? <div className="state-card"><div className="spinner" />Loading students…</div> : error ? <div className="state-card state-error"><span>!</span><h2>Students unavailable</h2><p>{error}</p></div> : (
        <section className="panel table-panel">
          <div className="panel-heading"><div><h2>Student records</h2><span>{students.length} students</span></div></div>
          {students.length ? <div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Name</th><th>Program</th><th>Previous institution</th><th>Status</th></tr></thead><tbody>{students.map((student) => <tr key={student._id}><td><strong>{student.studentId}</strong></td><td>{student.name}</td><td>{student.currentProgram || student.program || student.branch || "—"}</td><td>{student.previousInstitution || "—"}</td><td><span className={`status ${student.admissionStatus || "active"}`}>{student.admissionStatus || "active"}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><span>◎</span><h3>No students found</h3><p>Add a student to begin building your database.</p></div>}
        </section>
      )}
    </div>
  );
};

export default Students;