import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import { useAuth } from "./auth/useAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import WorkspacePage from "./pages/WorkspacePage";
import StudentHome from "./pages/StudentHome";
import StaffAccounts from "./pages/StaffAccounts";

const ProtectedRoute = ({ roles, children }) => {
  const { user, loading, error } = useAuth();
  if (loading) return <div className="state-card">Checking your session…</div>;
  if (error) return <div className="state-card">{error}</div>;
  if (!user) return <Navigate to="/login" replace />;
  return roles && !roles.includes(user.role) ? <Navigate to="/dashboard" replace /> : children;
};
const Home = () => useAuth().user.role === "student" ? <StudentHome /> : <Dashboard />;
const StaffOnly = ({ children }) => <ProtectedRoute roles={["staff", "admin"]}>{children}</ProtectedRoute>;

const App = () => (
  <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<Home />} />
      <Route path="students" element={<StaffOnly><Students /></StaffOnly>} />
      <Route path="transfers" element={<StaffOnly><WorkspacePage /></StaffOnly>} />
      <Route path="subjects" element={<StaffOnly><WorkspacePage /></StaffOnly>} />
      <Route path="evaluations" element={<StaffOnly><WorkspacePage /></StaffOnly>} />
      <Route path="staff" element={<ProtectedRoute roles={["admin"]}><StaffAccounts /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></BrowserRouter></AuthProvider>
);
export default App;
