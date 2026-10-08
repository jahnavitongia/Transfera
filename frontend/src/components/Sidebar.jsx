import { NavLink, useNavigate } from "react-router-dom";

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("transferaToken");
        navigate("/login");
    };

    return (
        <aside className="sidebar">

            <div className="brand">

                <div className="brand-logo">
                    T
                </div>

                <span>
                    Transfera
                </span>

            </div>

            <nav>

                <NavLink
                    to="/dashboard"
                    className="nav-item"
                >
                    Dashboard
                </NavLink>

                <NavLink
                    to="/students"
                    className="nav-item"
                >
                    Students
                </NavLink>

                <NavLink
                    to="/transfers"
                    className="nav-item"
                >
                    Transfers
                </NavLink>

                <NavLink
                    to="/subjects"
                    className="nav-item"
                >
                    Subjects
                </NavLink>

                <NavLink
                    to="/evaluations"
                    className="nav-item"
                >
                    Evaluations
                </NavLink>

            </nav>

            <div className="sidebar-bottom">

                <button onClick={handleLogout}>
                    Logout
                </button>

            </div>

        </aside>
    );
};

export default Sidebar;