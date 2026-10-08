import { useAuth } from "../auth/useAuth";
export default function StudentHome() {
  const { user } = useAuth();
  return <div className="dashboard-page">
    <header className="page-header"><div><p className="eyebrow">Student workspace</p><h1>Welcome, {user.name}</h1><p>Your academic record and application status in one place.</p></div></header>
    <section className="panel"><div className="panel-heading"><h2>Your account</h2></div><div className="account-details"><p><strong>Name:</strong> {user.name}</p><p><strong>Email:</strong> {user.email}</p><p><strong>Account:</strong> Student</p></div></section>
  </div>;
}
