import { useState, useEffect, type FormEvent } from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../globalConfig';
import { useAuth } from '../context/AuthContext';
import { setAuthUser, hydrateProfileFromAuth, saveProfile, getAuthUser } from '../utils/profileStore';
import { PasswordChecklist, isPasswordValidComplete } from '../components/PasswordChecklist';
import './Login.css';
import './portalBadge.css';

const Login = () => {
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const urlRole = hashParams.get('role');
    const [role, setRole] = useState<'candidate' | 'recruiter'>(urlRole === 'recruiter' ? 'recruiter' : 'candidate');

    // Update URL when role changes
    useEffect(() => {
        const currentHash = window.location.hash.split('?')[0];
        window.location.hash = `${currentHash}?role=${role}`;
    }, [role]);

    const [passwordFocused, setPasswordFocused] = useState(false);

    const [errors, setErrors] = useState<{ email?: string; password?: string; auth?: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

    // Redirect if already authenticated — use stored role to route correctly
    useEffect(() => {
        if (isAuthenticated) {
            const stored = getAuthUser();
            if (stored?.role === 'recruiter') {
                window.location.hash = '#/recruiter/dashboard';
            } else {
                window.location.hash = '#/candidate/dashboard';
            }
        }
    }, [isAuthenticated]);

    // Countdown effect for lockout
    useEffect(() => {
        let interval: number;
        if (lockoutTimer && lockoutTimer > 0) {
            interval = window.setInterval(() => {
                setLockoutTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
            }, 1000);
        }
        return () => window.clearInterval(interval);
    }, [lockoutTimer]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Local validation for email and password presence
        const newErrors: { email?: string; password?: string; auth?: string } = {};
        if (!email) {
            newErrors.email = 'Email is required';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Clear any stale local data to ensure full isolation (Bug #2)
        localStorage.clear();
        sessionStorage.clear();

        setIsLoading(true);
        setErrors({}); // Clear previous errors

        try {
            // Recruiter logins use the dedicated Recruiter collection
            const loginUrl = role === 'recruiter'
                ? `${API_BASE_URL}/api/recruiter-auth/login`
                : `${API_BASE_URL}/api/auth/login`;

            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                // Persist user identity so profile page can use real data
                setAuthUser({
                    fullName: data.fullName || '',
                    email: data.email || email,
                    token: data.accessToken,
                    role: data.role || 'candidate',
                    _id: data._id,
                });
                localStorage.setItem('auth_token', data.accessToken);
                hydrateProfileFromAuth();
                saveProfile({ onboardingDone: data.onboardingDone || false });
                login(data.accessToken);

                // Redirect URL Binding logic (Ticket #18)
                const pendingRaw = sessionStorage.getItem('pendingRedirect');
                if (pendingRaw) {
                    try {
                        const pending = JSON.parse(pendingRaw);
                        if (pending.userId === data._id && pending.role === data.role) {
                            window.location.hash = pending.url;
                            sessionStorage.removeItem('pendingRedirect');
                            return; // Follow redirect URL specifically bound to user
                        }
                    } catch (e) { }
                    sessionStorage.removeItem('pendingRedirect'); // discard on new session creation logic
                }

                // Smart route: recruiters always go to dashboard, candidates to confirmation if not onboarded
                if (data.role === 'recruiter') {
                    window.location.hash = '#/recruiter/dashboard';
                } else if (!data.onboardingDone) {
                    window.location.hash = '#/users/Cofirmation-Page';
                } else {
                    window.location.hash = '#/candidate/dashboard';
                }
            } else {
                if (data.lockedUntil) {
                    const msLeft = new Date(data.lockedUntil).getTime() - Date.now();
                    setLockoutTimer(Math.max(0, Math.ceil(msLeft / 1000)));
                }
                setErrors({ auth: data.message || 'Invalid credentials' });
            }
        } catch (err) {
            setErrors({ auth: 'Server unreachable. Try again later.' });
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordValid = isPasswordValidComplete(password);
    const canSubmit = email && isPasswordValid;

    return (
        <div className="login-page">
            {/* Left side: Branding/Hero */}
            <div className="login-sidebar">
                <div className="sidebar-content">
                    <div className="logo" onClick={() => window.location.hash = 'home'} style={{ cursor: 'pointer' }}>
                        <div className="logo-icon-container">
                            <Layers className="logo-icon" color="white" />
                        </div>
                        <span className="logo-text text-white">ProvaHire</span>
                    </div>

                    <h1 className="sidebar-title">
                        Your next opportunity<br />
                        starts here
                    </h1>

                    <p className="sidebar-subtitle">
                        Join thousands of professionals finding their dream roles through intelligent matching.
                    </p>

                    <div className="feature-list">
                        <div className="feature-item">
                            <div className="feature-icon-wrapper blue">
                                <div className="inner-dot"></div>
                            </div>
                            <span>AI-powered matching</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon-wrapper purple">
                                <div className="inner-pulse"></div>
                            </div>
                            <span>Real-time tracking</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon-wrapper green">
                                <div className="inner-check"></div>
                            </div>
                            <span>Skill-based hiring</span>
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer">
                    &copy; {new Date().getFullYear()} ProvaHire. All rights reserved.
                </div>
            </div>

            {/* Right side: Login Form */}
            <div className="login-main">
                <div className="login-form-container">
                    <div className="login-header">
                        <span className={`portal-badge ${role}`}>{role === 'candidate' ? 'Candidate Portal' : 'Recruiter Portal'}</span>
                        <h2>Welcome Back</h2>
                        <p>Please enter your details to sign in</p>
                    </div>

                    {/* Role Toggle */}
                    <div className="role-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${role === 'candidate' ? 'active' : ''}`}
                            onClick={() => setRole('candidate')}
                        >
                            Candidate
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${role === 'recruiter' ? 'active' : ''}`}
                            onClick={() => setRole('recruiter')}
                        >
                            Recruiter
                        </button>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {errors.auth && (
                            <div className="error-banner">
                                {errors.auth}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={role === 'candidate' ? 'candidate@example.com' : 'employer@company.com'}
                                className={errors.email ? 'input-error' : ''}
                                disabled={isLoading}
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <div className="password-header">
                                <label htmlFor="password">Password</label>
                                <a href={`#/forgot-password?role=${role}`} className="forgot-link">Forgot Password?</a>
                            </div>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    placeholder="••••••••"
                                    className={errors.password ? 'input-error' : ''}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <PasswordChecklist
                                password={password}
                                visible={passwordFocused || (password.length > 0 && !isPasswordValid)}
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <button
                            type="submit"
                            className="submit-btn primary-btn block-btn"
                            disabled={isLoading || !canSubmit || (lockoutTimer !== null && lockoutTimer > 0)}
                        >
                            {lockoutTimer && lockoutTimer > 0
                                ? `Locked (${Math.floor(lockoutTimer / 60)}:${(lockoutTimer % 60).toString().padStart(2, '0')})`
                                : isLoading ? 'Signing In...' : 'Sign In'}
                        </button>

                        <div className="divider">
                            <span>OR CONTINUE WITH</span>
                        </div>

                        <button type="button" className="google-btn block-btn" disabled={isLoading}>
                            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>

                        <div className="auth-footer">
                            Don't have an account? <a href={`#/#register?role=${role}`} className="auth-link">Create an account</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
