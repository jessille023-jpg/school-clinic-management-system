
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    Outlet
} from 'react-router-dom';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Students from './pages/Students';

// Protect pages that require login
function ProtectedRoute() {
    const token = localStorage.getItem('token');

    return token
        ? <Outlet />
        : <Navigate to="/login" replace />;
}

function App() {
    return (
        <Router>
            <Routes>
                {/* Public route */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />
                    <Route
                        path="/services"
                        element={<Services />}
                    />
                    <Route
                        path="/students"
                        element={<Students />}
                    />
                </Route>

                {/* Default and unknown routes */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />
            </Routes>
        </Router>
    );
}

export default App;
