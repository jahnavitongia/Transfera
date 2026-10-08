import { useEffect, useState } from "react";
import { get, post } from "../services/api";
export default function StaffAccounts() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    get("/auth/staff").then(response => { if (active) setUsers(response.data.users); })
      .catch(() => { if (active) setError("Unable to load staff accounts"); });
    return () => { active = false; };
  }, []);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await post("/auth/staff", form);
      setUsers(current => [...current, response.data.user]);
      setForm({ name: "", email: "", password: "" }); setMessage("Staff account created. Share its sign-in details with the staff member.");
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to create staff account"); }
    finally { setBusy(false); }
  };
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Administrator</p><h1>Staff accounts</h1><p>Create accounts for staff who review student applications.</p></div></header>
    <section className="panel"><div className="panel-heading"><h2>Add staff member</h2></div>
      <form className="record-form" onSubmit={submit}>
        <label>Full name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>Email<input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
        <label>Initial password<input type="password" required minLength={8} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
        {error && <p role="alert" className="error-message">{error}</p>}{message && <p role="status">{message}</p>}
        <button className="primary-button" disabled={busy}>{busy ? "Creating…" : "Create staff account"}</button>
      </form>
    </section>
    <section className="panel table-panel"><div className="panel-heading"><h2>Staff members</h2></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td></tr>)}</tbody></table></div></section>
  </div>;
}
