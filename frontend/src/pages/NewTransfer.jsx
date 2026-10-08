import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "../services/api";
const blankCourse = () => ({ code: "", name: "", credits: 4, gradePoint: 8, topics: "" });
const sampleCourses = [
  { code: "OLD101", name: "Intro to Programming", credits: 4, gradePoint: 8, topics: "Variables, control flow, functions, arrays" },
  { code: "OLD102", name: "Mathematics", credits: 4, gradePoint: 3, topics: "Algebra, matrices, calculus" },
  { code: "OLD201", name: "Data Structures", credits: 4, gradePoint: 7, topics: "Lists, stacks, queues, trees, sorting" },
  { code: "OLD202", name: "DBMS", credits: 2, gradePoint: 8, topics: "Relational model, SQL, normalization" },
];
const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ fileName: file.name || "sample-transcript.txt", mimeType: file.type, content: reader.result.split(",")[1] });
  reader.onerror = () => reject(new Error("Unable to read transcript")); reader.readAsDataURL(file);
});
export default function NewTransfer() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState("BCA");
  const [reason, setReason] = useState("");
  const [courses, setCourses] = useState([blankCourse()]);
  const [transcript, setTranscript] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    get("/profile").then(({ data }) => { if (active) { setProfile(data.student); setPolicy(data.policy); } })
      .catch(requestError => { if (active) setError(requestError.response?.data?.message || "Unable to load profile"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const updateCourse = (index, key, value) => setCourses(current => current.map((course, position) => position === index ? { ...course, [key]: value } : course));
  const samples = async () => {
    setCourses(sampleCourses.map(course => ({ ...course }))); setReason("Relocation and continuation of undergraduate study.");
    const text = `FICTIONAL DEMO TRANSCRIPT — NOT AN OFFICIAL RECORD\nStudent: ${profile.name}\nPrevious institution: ${profile.previousInstitution}\nProgram: ${profile.previousProgram}\n` + sampleCourses.map(course => `${course.code}: ${course.name}; credits ${course.credits}; grade ${course.gradePoint}/10`).join("\n");
    setTranscript(await readFile(new File([text], "sample-transcript.txt", { type: "text/plain" })));
  };
  const upload = async event => {
    const file = event.target.files[0]; setError(""); setTranscript(null);
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !["application/pdf", "text/plain"].includes(file.type)) { setError("Choose a PDF or text file up to 2 MB"); return; }
    try { setTranscript(await readFile(file)); } catch (readError) { setError(readError.message); }
  };
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await post("/transfers", { currentProgram: program, destinationSemester: 3, transferReason: reason, previousSubjects: courses, transcript });
      navigate(`/dashboard/transfers/${response.data.transfer._id}`);
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to submit transfer"); }
    finally { setBusy(false); }
  };
  if (loading) return <div className="state-card">Loading…</div>;
  if (!profile?.dateOfBirth || !profile.previousStudentId) return <div className="state-card"><p>Complete your profile before submitting a transfer. <Link to="/dashboard/profile">Go to profile →</Link></p>{error && <p role="alert">{error}</p>}</div>;
  if (profile.transferStatus === "pending") return <div className="state-card"><p>You already have a transfer under review. <Link to="/dashboard/transfers">View your requests →</Link></p></div>;
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Step 2</p><h1>New transfer request</h1><p>{profile.previousInstitution} · {profile.previousProgram} → {policy.institution}</p></div></header>
    <p className="notice">Sample curriculum {policy.curriculumVersion}. Entry into semester 3; staff will review subjects from semesters 1–2.</p>
    <form className="panel transfer-form" onSubmit={submit}>
      <fieldset disabled={busy}><legend>Destination and completed subjects</legend>
        <div className="form-grid"><label>Destination program<select value={program} onChange={event => setProgram(event.target.value)}>{policy.programs.map(value => <option key={value}>{value}</option>)}</select></label><label>Destination semester<input value="3" readOnly /></label></div>
        <label>Reason for transfer<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)} /></label>
        <div className="section-actions"><h2>Completed subjects</h2><button type="button" className="secondary-button" onClick={samples}>Use sample subjects and transcript</button></div>
        <p className="muted">Sample data includes a failed grade and a credit shortfall to demonstrate review.</p>
        {courses.map((course, index) => <div className="course-entry" key={index}><div className="form-grid course-grid">
          <label>Code<input required value={course.code} onChange={event => updateCourse(index, "code", event.target.value)} /></label>
          <label>Subject name<input required value={course.name} onChange={event => updateCourse(index, "name", event.target.value)} /></label>
          <label>Credits<input type="number" required min="1" max="30" step="1" value={course.credits} onChange={event => updateCourse(index, "credits", event.target.value)} /></label>
          <label>Grade points / 10<input type="number" required min="0" max="10" step="0.1" value={course.gradePoint} onChange={event => updateCourse(index, "gradePoint", event.target.value)} /></label>
        </div><label>Topics studied<input maxLength={2000} value={course.topics} onChange={event => updateCourse(index, "topics", event.target.value)} /></label>
        {courses.length > 1 && <button type="button" className="text-button" onClick={() => setCourses(current => current.filter((_, position) => position !== index))}>Remove subject {index + 1}</button>}</div>)}
        <button type="button" className="secondary-button" disabled={courses.length >= 30} onClick={() => setCourses([...courses, blankCourse()])}>Add subject</button>
        <label>Transcript (PDF or text, up to 2 MB)<input type="file" accept=".pdf,.txt" onChange={upload} /></label>
        {transcript && <p className="success-message">Attached: {transcript.fileName}</p>}
        <button className="primary-button" disabled={busy || !transcript}>{busy ? "Submitting…" : "Submit transfer request"}</button>
      </fieldset>
      {error && <p role="alert" className="error-message">{error}</p>}
    </form>
  </div>;
}
