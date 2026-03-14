import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../globalConfig';
import { Layers, CheckCircle2, Check, User, Briefcase, Eye, EyeOff } from 'lucide-react';
import { PasswordChecklist, isPasswordValidComplete } from '../components/PasswordChecklist';
import './Register.css';
import './portalBadge.css';

const Register = () => {
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const urlRole = hashParams.get('role');
    const [role, setRole] = useState<'candidate' | 'recruiter'>(urlRole === 'recruiter' ? 'recruiter' : 'candidate');

    // Update URL when role changes
    useEffect(() => {
        const currentHash = window.location.hash.split('?')[0];
        window.location.hash = `${currentHash}?role=${role}`;
    }, [role]);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        password: '',
        confirmPassword: '',
        terms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!isPasswordValidComplete(formData.password)) {
            setError('Password does not meet complexity requirements. Please try again.');
            return;
        }

        // Clear any old session state BEFORE starting new registration flow
        localStorage.clear();
        sessionStorage.clear();

        setIsLoading(true);

        try {
            // Recruiter registrations go to the dedicated Recruiter collection
            const url = role === 'recruiter'
                ? `${API_BASE_URL}/api/recruiter-auth/register`
                : `${API_BASE_URL}/api/auth/register`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: role,
                    ...(role === 'recruiter' && { company: formData.company }),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success - OTP sent. Navigate to OTP page immediately.
                sessionStorage.setItem('registeredEmail', formData.email);
                sessionStorage.setItem('registeredRole', role);
                window.location.hash = '#/#register/#otp';
                // Manually dispatch hashchange in case browser optimises the re-set away
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Could not connect to the server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isPasswordValid = isPasswordValidComplete(formData.password);
    const doPasswordsMatch = isPasswordValid && formData.password === formData.confirmPassword;
    const canSubmit = formData.name && formData.email && (role === 'candidate' || formData.company) && doPasswordsMatch && formData.terms;

    return (
        <div className="register-container">
            {/* Left Side (Branding/Testimonials) */}
            <div className="register-left">
                <div className="register-logo animate-item delay-1">
                    <Layers className="register-logo-icon" />
                    <span className="register-logo-text">ProvaHire</span>
                </div>

                <div className="register-content">
                    <h1 className="register-title animate-item delay-2">Join the next<br />generation of hiring.</h1>
                    <p className="register-subtitle animate-item delay-3">
                        Connecting talent with opportunity through seamless synchronization.
                    </p>

                    <div className="register-features">
                        <div className="feature-item animate-item delay-4">
                            <CheckCircle2 className="feature-icon" size={20} />
                            <span>Access thousands of job listings</span>
                        </div>
                        <div className="feature-item animate-item delay-5">
                            <CheckCircle2 className="feature-icon" size={20} />
                            <span>AI-powered candidate matching</span>
                        </div>
                        <div className="feature-item animate-item delay-6">
                            <CheckCircle2 className="feature-icon" size={20} />
                            <span>Real-time interview scheduling</span>
                        </div>
                    </div>
                </div>

                <div className="register-testimonial animate-item delay-7">
                    <p className="testimonial-quote">
                        "ProvaHire transformed our recruiting process. We found the perfect fit in half the time compared to traditional boards."
                    </p>
                    <div className="testimonial-author">
                        <div className="author-avatar">SC</div>
                        <div className="author-info">
                            <div className="author-name">Sarah Chen</div>
                            <div className="author-role">Talent Acquisition, TechFlow</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side (Form) */}
            <div className="register-right">
                <div className="register-form-wrapper">
                    <span className={`portal-badge ${role}`} style={{ marginBottom: '16px' }}>{role === 'candidate' ? 'Candidate Portal' : 'Recruiter Portal'}</span>
                    <h2 className="form-head">Create Account</h2>
                    <p className="form-subhead">Join ProvaHire today and start your journey.</p>

                    <div className="form-section">
                        <label className="section-label">SELECT YOUR ROLE</label>
                        <div className="role-selector">
                            <div
                                className={`role-card ${role === 'candidate' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                                onClick={() => !isLoading && setRole('candidate')}
                                style={{ opacity: isLoading ? 0.7 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
                            >
                                <div className="role-header">
                                    <User size={20} className="role-icon" />
                                    {role === 'candidate' && <div className="role-check"><Check size={14} /></div>}
                                </div>
                                <div className="role-title">Candidate</div>
                                <div className="role-desc">I am looking for a job</div>
                            </div>
                            <div
                                className={`role-card ${role === 'recruiter' ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
                                onClick={() => !isLoading && setRole('recruiter')}
                                style={{ opacity: isLoading ? 0.7 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
                            >
                                <div className="role-header">
                                    <Briefcase size={20} className="role-icon" />
                                    {role === 'recruiter' && <div className="role-check"><Check size={14} /></div>}
                                </div>
                                <div className="role-title">Recruiter</div>
                                <div className="role-desc">I am hiring talent</div>
                            </div>
                        </div>
                    </div>

                    <form className="register-form" onSubmit={handleSubmit}>
                        {error && <div className="error-message" style={{ color: '#ef4444', fontSize: '0.85rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px' }}>{error}</div>}

                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required disabled={isLoading} />
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@company.com" required disabled={isLoading} />
                        </div>
                        {role === 'recruiter' && (
                            <div className="input-group">
                                <label>Company Name</label>
                                <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Acme Corp" required disabled={isLoading} />
                            </div>
                        )}
                        <div className="input-row">
                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                        className={doPasswordsMatch ? 'match-success' : ''}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <PasswordChecklist
                                    password={formData.password}
                                    visible={passwordFocused || (formData.password.length > 0 && !isPasswordValid)}
                                />
                            </div>
                            <div className="input-group">
                                <label>Confirm Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        disabled={isLoading}
                                        className={doPasswordsMatch ? 'match-success' : ''}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={isLoading}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="terms-checkbox">
                            <input type="checkbox" id="terms" name="terms" checked={formData.terms} onChange={handleChange} required disabled={isLoading} />
                            <label htmlFor="terms">
                                By signing up, I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="register-submit-btn"
                            disabled={isLoading || !canSubmit}
                            style={{ opacity: (isLoading || !canSubmit) ? 0.7 : 1 }}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>OR REGISTER WITH</span>
                    </div>

                    <div className="social-login">
                        <button className="social-btn">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" width="18" />
                            Google
                        </button>
                        <button className="social-btn">
                            <svg viewBox="0 0 384 512" width="18" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
                            Apple
                        </button>
                    </div>

                    <div className="login-link">
                        Already have an account? <a href={`#/login?role=${role}`}>Log in</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
