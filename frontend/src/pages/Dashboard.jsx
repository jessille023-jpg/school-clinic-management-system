import { useCallback, useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Dashboard.css";

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/dashboard");
            setStats(response.data);
        } catch (err) {
            console.error("Dashboard error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load dashboard. Please check your login session."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const formatTime = (value) => {
        if (!value) return "—";

        const parts = String(value).split(":");
        if (parts.length < 2) return value;

        const date = new Date();
        date.setHours(Number(parts[0]), Number(parts[1]), 0, 0);

        return date.toLocaleTimeString("en-PH", {
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const statCards = [
        {
            title: "Active Students",
            value: stats?.totalStudents ?? 0,
            icon: "♙",
            color: "green",
            description: "Currently active student records"
        },
        {
            title: "Total Clinic Visits",
            value: stats?.totalVisits ?? 0,
            icon: "▤",
            color: "blue",
            description: "All recorded clinic visits"
        },
        {
            title: "Today's Visits",
            value: stats?.todayVisits ?? 0,
            icon: "◷",
            color: "orange",
            description: "Visits recorded today"
        },
        {
            title: "This Month",
            value: stats?.monthlyVisits ?? 0,
            icon: "▦",
            color: "purple",
            description: "Visits recorded this month"
        },
        {
            title: "Follow-ups Required",
            value: stats?.followUpsRequired ?? 0,
            icon: "↻",
            color: "red",
            description: "Visits needing follow-up"
        }
    ];

    const breakdown = stats?.breakdown ?? [];

    const maximum = Math.max(
        ...breakdown.map((item) => Number(item.count) || 0),
        1
    );

    return (
        <Layout>
            <main className="dashboard-page">
                <header className="dashboard-header">
                    <div>
                        <span className="dashboard-eyebrow">
                            UNIVERSITY OF ILOILO · PHINMA
                        </span>

                        <h1>Clinic Dashboard</h1>

                        <p>
                            Monitor student health services and clinic activities.
                        </p>
                    </div>

                    <button
                        className="dashboard-refresh"
                        onClick={loadDashboard}
                        disabled={loading}
                    >
                        <span className={loading ? "refresh-spinning" : ""}>
                            ↻
                        </span>
                        {loading ? "Loading..." : "Refresh Data"}
                    </button>
                </header>

                <div className="dashboard-date">
                    <span>◷</span>
                    {new Date().toLocaleDateString("en-PH", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                    })}
                </div>

                {error && (
                    <div className="dashboard-error" role="alert">
                        <strong>Unable to load dashboard</strong>
                        <p>{error}</p>

                        <button onClick={loadDashboard}>
                            Try Again
                        </button>
                    </div>
                )}

                {loading && !stats ? (
                    <div className="dashboard-loading">
                        <div className="dashboard-spinner" />
                        <p>Loading clinic statistics...</p>
                    </div>
                ) : stats ? (
                    <>
                        <section className="dashboard-section">
                            <div className="dashboard-section-heading">
                                <div>
                                    <h2>Clinic Overview</h2>
                                    <p>Summary of clinic activity</p>
                                </div>
                            </div>

                            <div className="dashboard-stat-grid">
                                {statCards.map((card) => (
                                    <article
                                        className="dashboard-stat-card"
                                        key={card.title}
                                    >
                                        <div className="stat-card-top">
                                            <span className="stat-card-title">
                                                {card.title}
                                            </span>

                                            <span
                                                className={`stat-card-icon ${card.color}`}
                                                aria-hidden="true"
                                            >
                                                {card.icon}
                                            </span>
                                        </div>

                                        <div className="stat-card-value">
                                            {card.value}
                                        </div>

                                        <p className="stat-card-description">
                                            {card.description}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <div className="dashboard-content-grid">
                            <section className="dashboard-panel">
                                <div className="dashboard-panel-heading">
                                    <div>
                                        <h2>Visits by Type</h2>
                                        <p>
                                            Breakdown of recorded clinic services
                                        </p>
                                    </div>

                                    <span className="panel-heading-icon">
                                        ▥
                                    </span>
                                </div>

                                {breakdown.length > 0 ? (
                                    <div className="visit-breakdown">
                                        {breakdown.map((item, index) => {
                                            const count =
                                                Number(item.count) || 0;

                                            const percentage =
                                                (count / maximum) * 100;

                                            return (
                                                <div
                                                    className="visit-breakdown-item"
                                                    key={`${item.visit_type}-${index}`}
                                                >
                                                    <div className="visit-breakdown-label">
                                                        <span>
                                                            {item.visit_type}
                                                        </span>
                                                        <strong>{count}</strong>
                                                    </div>

                                                    <div
                                                        className="visit-progress-track"
                                                        role="progressbar"
                                                        aria-label={item.visit_type}
                                                        aria-valuenow={count}
                                                        aria-valuemin={0}
                                                        aria-valuemax={maximum}
                                                    >
                                                        <div
                                                            className="visit-progress-fill"
                                                            style={{
                                                                width: `${percentage}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="dashboard-empty">
                                        <span>▤</span>
                                        <p>No clinic visits recorded yet.</p>
                                    </div>
                                )}
                            </section>

                            <section className="dashboard-panel recent-visits-panel">
                                <div className="dashboard-panel-heading">
                                    <div>
                                        <h2>Recent Clinic Visits</h2>
                                        <p>
                                            Latest recorded student consultations
                                        </p>
                                    </div>

                                    <span className="panel-heading-icon">
                                        ◷
                                    </span>
                                </div>

                                {stats.recentVisits?.length > 0 ? (
                                    <div className="recent-visits-table-wrapper">
                                        <table className="recent-visits-table">
                                            <thead>
                                                <tr>
                                                    <th>Student</th>
                                                    <th>Visit Type</th>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {stats.recentVisits.map((visit) => {
                                                    const studentName =
                                                        String(
                                                            visit.student_name ||
                                                            "Unknown student"
                                                        ).trim();

                                                    return (
                                                        <tr key={visit.id}>
                                                            <td>
                                                                <div className="recent-student">
                                                                    <span
                                                                        className="student-avatar"
                                                                        aria-hidden="true"
                                                                    >
                                                                        {studentName
                                                                            .charAt(0)
                                                                            .toUpperCase()}
                                                                    </span>

                                                                    <span className="recent-student-name">
                                                                        {studentName}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            <td>
                                                                <span className="visit-type-badge">
                                                                    {visit.visit_type}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                {formatDate(visit.visit_date)}
                                                            </td>

                                                            <td>
                                                                {formatTime(visit.visit_time)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="dashboard-empty">
                                        <span>▤</span>
                                        <p>No recent visits to display.</p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </>
                ) : (
                    !error && (
                        <div className="dashboard-empty">
                            <p>No dashboard data is available.</p>

                            <button
                                className="dashboard-refresh"
                                onClick={loadDashboard}
                            >
                                Try Again
                            </button>
                        </div>
                    )
                )}
            </main>
        </Layout>
    );
};

export default Dashboard;
