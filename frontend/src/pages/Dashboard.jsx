import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {

    const [students, setStudents] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [loading, setLoading] = useState(true);

    const token =
        localStorage.getItem("transferaToken");

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    useEffect(() => {

        const fetchDashboardData = async () => {

            try {

                const [
                    studentsResponse,
                    transfersResponse,
                    subjectsResponse
                ] = await Promise.all([

                    axios.get(
                        "http://localhost:5001/api/students",
                        config
                    ),

                    axios.get(
                        "http://localhost:5001/api/transfers",
                        config
                    ),

                    axios.get(
                        "http://localhost:5001/api/subjects",
                        config
                    )

                ]);

                setStudents(
                    studentsResponse.data.students || []
                );

                setTransfers(
                    transfersResponse.data.transfers || []
                );

                setSubjects(
                    subjectsResponse.data.subjects || []
                );

            } catch (error) {

                console.error(
                    "Dashboard Error:",
                    error
                );

            } finally {

                setLoading(false);

            }
        };

        fetchDashboardData();

    }, []);

    const pendingTransfers =
        transfers.filter(
            transfer =>
                transfer.status === "pending"
        ).length;

    const approvedTransfers =
        transfers.filter(
            transfer =>
                transfer.status === "approved"
        ).length;

    if (loading) {

        return (
            <div className="loading-screen">
                Loading Transfera...
            </div>
        );

    }

    return (

        <div className="dashboard">

            {/* SIDEBAR */}

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

                    <a className="nav-item active">
                        Dashboard
                    </a>

                    <a className="nav-item">
                        Students
                    </a>

                    <a className="nav-item">
                        Transfers
                    </a>

                    <a className="nav-item">
                        Subjects
                    </a>

                    <a className="nav-item">
                        Evaluations
                    </a>

                </nav>

                <div className="sidebar-bottom">

                    <button
                        onClick={() => {

                            localStorage.removeItem(
                                "transferaToken"
                            );

                            window.location.href =
                                "/login";

                        }}
                    >
                        Logout
                    </button>

                </div>

            </aside>


            {/* MAIN CONTENT */}

            <main className="dashboard-main">

                <header className="dashboard-header">

                    <div>

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Overview of student
                            transfers and evaluations
                        </p>

                    </div>

                    <div className="admin-badge">

                        Admin

                    </div>

                </header>


                {/* STAT CARDS */}

                <section className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-title">
                            Total Students
                        </div>

                        <div className="stat-value">
                            {students.length}
                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-title">
                            Total Transfers
                        </div>

                        <div className="stat-value">
                            {transfers.length}
                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-title">
                            Current Subjects
                        </div>

                        <div className="stat-value">
                            {subjects.length}
                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-title">
                            Pending Transfers
                        </div>

                        <div className="stat-value">
                            {pendingTransfers}
                        </div>

                    </div>

                </section>


                {/* TRANSFER SUMMARY */}

                <section className="content-grid">

                    <div className="panel">

                        <div className="panel-header">

                            <h2>
                                Recent Transfers
                            </h2>

                            <span>
                                {transfers.length}
                            </span>

                        </div>


                        {transfers.length === 0 ? (

                            <div className="empty-state">

                                No transfers found.

                            </div>

                        ) : (

                            <div className="transfer-list">

                                {transfers
                                    .slice(0, 5)
                                    .map(transfer => (

                                        <div
                                            className="transfer-row"
                                            key={transfer._id}
                                        >

                                            <div>

                                                <strong>
                                                    {transfer.student?.studentId ||
                                                        "Student"}
                                                </strong>

                                                <p>
                                                    {transfer.previousInstitution ||
                                                        "Previous Institution"}
                                                </p>

                                            </div>

                                            <span
                                                className={`status ${transfer.status}`}
                                            >
                                                {transfer.status ||
                                                    "pending"}
                                            </span>

                                        </div>

                                    ))}

                            </div>

                        )}

                    </div>


                    <div className="panel">

                        <div className="panel-header">

                            <h2>
                                Transfer Status
                            </h2>

                        </div>

                        <div className="status-summary">

                            <div>

                                <strong>
                                    {approvedTransfers}
                                </strong>

                                <span>
                                    Approved
                                </span>

                            </div>

                            <div>

                                <strong>
                                    {pendingTransfers}
                                </strong>

                                <span>
                                    Pending
                                </span>

                            </div>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
};

export default Dashboard;