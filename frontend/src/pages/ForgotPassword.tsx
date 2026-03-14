import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../globalConfig';
import { Layers, Mail, AlertCircle, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import './ForgotPassword.css';
import './portalBadge.css';

const ForgotPassword = () => {
    // 1: Enter Email, 2: Enter OTP & New Password
    const [step, setStep] = useState<1 | 2>(1);

    // Form Inputs
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const urlRole = hashParams.get('role');

    const [role] = useState<'candidate' | 'recruiter'>(urlRole === 'recruiter' ? 'recruiter' : 'candidate');

    // Update URL for consistency
    useEffect(() => {
        const currentHash = window.location.hash.split('?')[0];
        window.location.hash = `${currentHash}?role=${role}`;
    }, [role]);

    // UI States
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step]);

    // ── OTP Handlers ──────────────────────────────────────────────────────────
    const handleOtpChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newOtp = [...otp];
        pasted.split('').forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    // ── STEP 1: Send Request Link ─────────────────────────────────────────────
    const handleSendLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email) {
            setError('Please enter your email address.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || 'If a matching account exists, you will receive an email shortly.');
                setTimeout(() => {
                    setStep(2);
                    setSuccessMessage('');
                }, 2500);
            } else {
                setError(data.message || 'Failed to request password reset.');
            }
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    // ── STEP 2: Reset Password ───────────────────────────────────────────────
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const isPasswordValid = passRegex.test(password);
    const doPasswordsMatch = isPasswordValid && password === confirmPassword && confirmPassword.length > 0;

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the fully compiled 6-digit OTP.');
            return;
        }

        if (!isPasswordValid) {
            setError('Password does not meet complexity requirements.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp: otpCode,
                    role: role,
                    newPassword: password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message || 'Password reset successfully! Redirecting...');
                setTimeout(() => {
                    window.location.hash = `#/login?role=${role}`;
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }, 2000);
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch {
            setError('Could not connect to the server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-left">
                <div className="forgot-logo animate-item delay-1">
                    <div className="logo-icon-wrapper">
                        <Layers size={22} className="logo-icon-inner" />
                    </div>
                    <span className="forgot-logo-text">ProvaHire</span>
                </div>
                <div className="forgot-content">
                    <h1 className="forgot-title animate-item delay-2">Secure access<br />restored.</h1>
                    <p className="forgot-subtitle animate-item delay-3">
                        Regain access to your ProvaHire account securely with multi-factor authentication.
                    </p>
                </div>
                <div className="forgot-footer animate-item delay-4">
                    &copy; 2026 ProvaHire Inc. All rights reserved.
                </div>
            </div>

            <div className="forgot-right">
                <div className="forgot-form-wrapper">

                    {error && (
                        <div className="forgot-message forgot-message--error">
                            <AlertCircle size={16} /> <span>{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="forgot-message forgot-message--success">
                            <CheckCircle2 size={16} /> <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Step 1: Enter Email */}
                    {step === 1 && (
                        <div className="step-container animate-fade-in">
                            <div className="icon-header">
                                <Mail size={28} />
                            </div>
                            <span className={`portal-badge ${role}`}>{role === 'candidate' ? 'Candidate Portal' : 'Recruiter Portal'}</span>
                            <h2 className="forgot-form-head">Forgot Password</h2>

                            <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem', display: 'inline-block', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Resetting password for: <strong>{role === 'candidate' ? 'Candidate' : 'Recruiter'} account</strong>
                            </div>

                            <p className="forgot-form-subhead">
                                Enter your registered email address and we'll send you a secure OTP to reset your password.
                            </p>
                            <form className="forgot-form" onSubmit={handleSendLink}>
                                <div className="input-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        placeholder={role === 'candidate' ? 'candidate@example.com' : 'employer@company.com'}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading || !!successMessage}
                                    />
                                </div>
                                <button type="submit" className="forgot-submit-btn" disabled={isLoading || !!successMessage}>
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                            <div className="forgot-back-link">
                                Remember your password? <a href={`#/login?role=${role}`}>Back to log in</a>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Reset Password via OTP */}
                    {step === 2 && (
                        <div className="step-container animate-fade-in">
                            <div className="icon-header">
                                <Lock size={28} />
                            </div>
                            <span className={`portal-badge ${role}`}>{role === 'candidate' ? 'Candidate Portal' : 'Recruiter Portal'}</span>
                            <h2 className="forgot-form-head">Verify Identity & Set New Password</h2>

                            <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem', display: 'inline-block', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                Resetting password for: <strong>{role === 'candidate' ? 'Candidate' : 'Recruiter'} account</strong>
                            </div>

                            <p className="forgot-form-subhead">
                                Enter the 6-digit OTP sent to {email} and your new password below.
                            </p>
                            <form className="forgot-form" onSubmit={handleResetPassword}>

                                <div className="input-group">
                                    <label>Verification Code (OTP)</label>
                                    <div className="otp-inputs" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                onPaste={handleOtpPaste}
                                                ref={(el) => { inputRefs.current[index] = el; }}
                                                className={`otp-input-box ${digit ? 'filled' : ''}`}
                                                placeholder="•"
                                                disabled={isLoading || !!successMessage}
                                                autoComplete="one-time-code"
                                                style={{ width: '100%', height: '48px', textAlign: 'center', fontSize: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>New Password</label>
                                    <div className="password-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            maxLength={8}
                                            disabled={isLoading || !!successMessage}
                                            className={isPasswordValid ? 'match-success' : ''}
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} disabled={isLoading || !!successMessage}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Confirm Password</label>
                                    <div className="password-wrapper">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            maxLength={8}
                                            disabled={isLoading || !!successMessage}
                                            className={doPasswordsMatch ? 'match-success' : ''}
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} disabled={isLoading || !!successMessage}>
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" className="forgot-submit-btn" disabled={isLoading || !!successMessage || !doPasswordsMatch || otp.join('').length !== 6}>
                                    {isLoading ? 'Resetting...' : 'Verify OTP & Reset Password'}
                                </button>
                            </form>
                            <div className="forgot-back-link">
                                Remember your password? <a href={`#/login?role=${role}`}>Back to log in</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
