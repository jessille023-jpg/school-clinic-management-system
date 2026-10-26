import { NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                   
                    <img
                        src="/image/school-logo.png.jpg"
                        alt="University of Iloilo logo"
                        className="school-logo"
                        onError={(e) => {
                        e.currentTarget.style.display = 'none';
                  }}
                />

                    <div className="brand-text">
                        <h2>Clinic System</h2>
                        <p>University of Iloilo</p>
                        <p>PHINMA Education Network</p>
                    </div>
                </div>

                <div className="sidebar-label">
                    MAIN MENU
                </div>

                <nav>
                    <ul className="nav-links">
                        <li>
                            <NavLink
                                to="/dashboard"
                                className={({ isActive }) =>
                                    isActive
                                        ? 'nav-link active'
                                        : 'nav-link'
                                }
                            >
                                <span className="nav-icon">▦</span>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/students"
                                className={({ isActive }) =>
                                    isActive
                                        ? 'nav-link active'
                                        : 'nav-link'
                                }
                            >
                                <span className="nav-icon">♙</span>
                                <span>Students</span>
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/services"
                                className={({ isActive }) =>
                                    isActive
                                        ? 'nav-link active'
                                        : 'nav-link'
                                }
                            >
                                <span className="nav-icon">✚</span>
                                <span>Clinic Services</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="sidebar-footer">
                    <div className="footer-info">
                        <div className="footer-avatar">
                            UI
                        </div>

                        <div>
                            <strong>Clinic Staff</strong>
                            <small>Clinic Management</small>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="logout-btn"
                    >
                        <span>↪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <span className="topbar-title">
                            School Clinic Management System
                        </span>

                        <span className="topbar-subtitle">
                            University of Iloilo – PHINMA Education Network
                        </span>
                    </div>

                    <div className="topbar-badge">
                        <span className="status-dot"></span>
                        Clinic Portal
                    </div>
                </header>

                <section className="page-content">
                    {children}
                </section>
            </main>
        </div>
    );
};

export default Layout;