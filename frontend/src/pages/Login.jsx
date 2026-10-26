
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import './Login.css';

const Login = () => {
    const [form, setForm] = useState({
        username: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            const { data } = await API.post('/auth/login', {
                username: form.username.trim(),
                password: form.password
            });

            if (!data.token) {
                throw new Error(
                    'The server did not return a login token.'
                );
            }

            localStorage.setItem('token', data.token);

            if (data.user) {
                localStorage.setItem(
                    'user',
                    JSON.stringify(data.user)
                );
            }

            navigate('/dashboard');
        } catch (err) {
            console.error(
                'Login failed:',
                err.response?.data || err.message
            );

            if (err.response?.status === 401) {
                setError('Invalid username or password.');
            } else if (err.response?.status === 404) {
                setError(
                    err.response?.data?.message ||
                    'User not found. Please check your username.'
                );
            } else if (err.response) {
                setError(
                    err.response.data?.message ||
                    'Login failed. Please try again.'
                );
            } else {
                setError(
                    'Cannot connect to the server. Please check your connection.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-shell">

                {/* University branding */}
                <header className="university-header">
                    <div className="university-logo">
                        <img
                            src="/image/school-logo.png.jpg"
                            alt="University of Iloilo school logo"
                        />
                    </div>

                    <div className="university-info">
                        <p className="university-name">
                            UNIVERSITY OF ILOILO
                        </p>
                        <p className="university-network">
                            PHINMA EDUCATION NETWORK
                        </p>
                    </div>
                </header>

                {/* Login card */}
                <main className="login-card">
                    <div className="clinic-symbol">
                        <span>+</span>
                    </div>

                    <p className="portal-label">
                        UNIVERSITY CLINIC
                    </p>

                    <h1>Clinic Portal</h1>

                    <p className="login-description">
                        Welcome back! Please sign in to access
                        clinic services and student health records.
                    </p>

                    {error && (
                        <div
                            className="login-error"
                            role="alert"
                            aria-live="polite"
                        >
                            <strong>Login unsuccessful</strong>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                id="username"
                                className="login-input"
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                                autoCapitalize="none"
                                spellCheck={false}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    className="login-input password-input"
                                    type={
                                        showPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    name="password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    className="password-toggle"
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((previous) =>
                                            !previous
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button
                            className="login-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? 'Logging in...'
                                : 'Log In'}
                            {!loading && (
                                <span aria-hidden="true">→</span>
                            )}
                        </button>
                    </form>

                    <div className="login-security">
                        <span className="security-icon">✓</span>
                        Authorized clinic personnel only
                    </div>
                </main>

                {/* Footer */}
                <footer className="login-footer">
                    <p>UNIVERSITY OF ILOILO · PHINMA</p>
                    <span>
                        School Clinic Management System
                    </span>
                </footer>

            </div>
        </div>
    );
};

export default Login;
