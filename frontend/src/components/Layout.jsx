import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: "grid" },
  { label: "Students", to: "/dashboard/students", icon: "users" },
  { label: "Transfers", to: "/dashboard/transfers", icon: "transfer" },
  { label: "Subjects", to: "/dashboard/subjects", icon: "book" },
];

const icons = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  transfer: <><path d="M4 7h16M4 12h16M4 17h10"/><path d="m17 14 3 3-3 3"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
  chart: <><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-7"/></>,
};

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const items = user.role === "student" ? [navigation[0], { label: "Your profile", to: "/dashboard/profile", icon: "users" }, { label: "Your transfers", to: "/dashboard/transfers", icon: "transfer" }] : [...navigation, ...(user.role === "admin" ? [{ label: "Staff accounts", to: "/dashboard/staff", icon: "users" }] : [])];

  const logout = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">T</div>
            <div><strong>Transfera</strong><span>Academic operations</span></div>
          </div>
          <button className="sidebar-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}>×</button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">{icons[item.icon]}</svg>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
            <div><strong>{user.name}</strong><span>{user.role}</span></div>
          </div>
          <button className="logout-button" onClick={logout}>Sign out</button>
        </div>
      </aside>

      {mobileOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
      <div className="workspace">
        <header className="mobile-header">
          <button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}>☰</button>
          <div className="brand compact"><div className="brand-mark">T</div><strong>Transfera</strong></div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
};

export default Layout;
