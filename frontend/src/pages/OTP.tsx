import { useState, useRef, useEffect, useCallback } from 'react';
import { Layers, ShieldCheck, Gauge, Headset, Clock, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { setAuthUser, hydrateProfileFromAuth, getProfile } from '../utils/profileStore';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../globalConfig';
import './OTP.css';
import './portalBadge.css';

const OTP_VALIDITY_SECONDS = 5 * 60; // 5 minutes, matching backend
const RESEND_COOLDOWN_SECONDS = 60;

const OTP = () => {
    const { login } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for OTP expiry (5 min)
    const [timeLeft, setTimeLeft] = useState(OTP_VALIDITY_SECONDS);
    const [isExpired, setIsExpired] = useState(false);

    // Resend cooldown (60 sec)
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Form state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const email = sessionStorage.getItem('registeredEmail') || 'your email';
    const role = sessionStorage.getItem('registeredRole') || 'candidate';

    // ── OTP Expiry Countdown ──────────────────────────────────────────────────
    useEffect(() => {
        window.scrollTo(0, 0);
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (timeLeft <= 0) {
            setIsExpired(true);
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsExpired(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    // ── Resend Cooldown Countdown ─────────────────────────────────────────────
    useEffect(() => {
        if (resendCooldown <= 0) {
            setCanResend(true);
            return;
        }
        setCanResend(false);
        const timer = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // ── OTP Input Handlers ────────────────────────────────────────────────────
    const handleChange = (index: number, value: string) => {
        if (value && !/^\d+$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // only last char
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const newOtp = [...otp];
        pasted.split('').forEach((char, i) => { newOtp[i] = char; });
        setOtp(newOtp);
        const nextIndex = Math.min(pasted.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResend = useCallback(async () => {
        if (!canResend || isResending) return;
        setIsResending(true);
        setError('');
        setSuccessMessage('');
        try {
            // Use recruiter-specific register endpoint to trigger resend for recruiter accounts
            const resendUrl = role === 'recruiter'
                ? `${API_BASE_URL}/api/recruiter-auth/register`
                : `${API_BASE_URL}/api/auth/register`;
            const response = await fetch(resendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: 'resend',
                    email,
                    password: role === 'recruiter' ? 'ResendTrigger1!' : 'resend-trigger',
                    role: role,
                }),
            });
            const data = await response.json();
            // The register endpoint returns 200 for "unverified user, new OTP sent"
            if (response.ok || response.status === 200) {
                setSuccessMessage('A new OTP has been sent to your email!');
                setTimeLeft(OTP_VALIDITY_SECONDS); // reset expiry timer
                setIsExpired(false);
                setOtp(['', '', '', '', '', '']);
                setResendCooldown(RESEND_COOLDOWN_SECONDS); // restart cooldown
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                setError(data.message || 'Failed to resend OTP. Please try again.');
            }
        } catch {
            setError('Could not connect to the server. Please try again.');
        } finally {
            setIsResending(false);
        }
    }, [canResend, isResending, email, role]);

    // ── Submit OTP ────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits of your OTP.');
            return;
        }

        if (isExpired) {
            setError('Your OTP has expired. Please request a new one.');
            return;
        }

        const storedEmail = sessionStorage.getItem('registeredEmail');
        if (!storedEmail) {
            setError('Session expired. Please register again.');
            setTimeout(() => {
                window.location.hash = '#/#register';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            }, 2000);
            return;
        }

        setIsLoading(true);
        try {
            // Use recruiter-specific OTP endpoint for recruiter accounts
            const otpUrl = role === 'recruiter'
                ? `${API_BASE_URL}/api/recruiter-auth/verify-otp`
                : `${API_BASE_URL}/api/auth/verify-otp`;
            const response = await fetch(otpUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: storedEmail, otp: otpCode, role: role }),
            });

            const data = await response.json();

            if (response.ok) {
                // Save user identity to profileStore (used by profile page)
                setAuthUser({
                    fullName: data.fullName || '',
                    email: data.email || storedEmail,
                    token: data.accessToken,
                    role: data.role || 'candidate',
                    _id: data._id,
                });
                hydrateProfileFromAuth();
                login(data.accessToken);
                sessionStorage.removeItem('registeredEmail');

                // Smart routing: new user → onboarding, returning user → dashboard
                const profile = getProfile();
                const isNewUser = !profile.onboardingDone;
                setSuccessMessage(isNewUser ? 'Verified! Setting up your profile...' : 'Verified! Redirecting to dashboard...');

                setTimeout(() => {
                    if (role === 'recruiter') {
                        // Always send recruiter to dashboard after verification
                        window.location.hash = '#/recruiter/dashboard';
                    } else {
                        // Candidate: new user → onboarding, returning user → dashboard
                        if (isNewUser) {
                            window.location.hash = '#/users/Cofirmation-Page';
                        } else {
                            window.location.hash = '#/candidate/dashboard';
                        }
                    }
                    window.dispatchEvent(new HashChangeEvent('hashchange'));
                }, 800);
            } else {
                setError(data.message || 'Invalid OTP. Please check and try again.');
                // Clear inputs for re-entry
                setOtp(['', '', '', '', '', '']);
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
            }
        } catch {
            setError('Could not connect to the server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isOtpComplete = otp.every(d => d !== '');

    return (
        <div className="otp-container">
            <div className="otp-left">
                <div>
                    <div className="otp-logo animate-item delay-1">
                        <div className="logo-icon-wrapper">
                            <Layers size={22} className="logo-icon-inner" />
                        </div>
                        <span className="otp-logo-text">ProvaHire</span>
                    </div>

                    <div className="otp-content">
                        <h1 className="otp-title animate-item delay-2">Next-gen Hiring Platform</h1>
                        <p className="otp-subtitle animate-item delay-3">
                            Streamline your recruitment process with AI-driven insights and verified talent pools.
                        </p>

                        <div className="otp-features">
                            <div className="feature-row animate-item delay-4">
                                <div className="feature-icon-container">
                                    <ShieldCheck size={20} />
                                </div>
                                <div className="feature-text">
                                    <div className="feature-title">Identity Verification</div>
                                    <div className="feature-desc">Secure 2FA for all talent interactions</div>
                                </div>
                            </div>
                            <div className="feature-row animate-item delay-5">
                                <div className="feature-icon-container">
                                    <Gauge size={20} />
                                </div>
                                <div className="feature-text">
                                    <div className="feature-title">Rapid Onboarding</div>
                                    <div className="feature-desc">Get teams ready in minutes, not days</div>
                                </div>
                            </div>
                            <div className="feature-row animate-item delay-6">
                                <div className="feature-icon-container">
                                    <Headset size={20} />
                                </div>
                                <div className="feature-text">
                                    <div className="feature-title">24/7 Priority Support</div>
                                    <div className="feature-desc">Expert help whenever you need it</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="otp-footer animate-item delay-7">
                    &copy; 2026 ProvaHire Inc. All rights reserved.
                </div>
            </div>

            <div className="otp-right">
                <div className="otp-form-wrapper">
                    <span className={`portal-badge ${role}`} style={{ marginBottom: '16px' }}>{role === 'candidate' ? 'Candidate Portal' : 'Recruiter Portal'}</span>

                    {/* Validity Timer Badge */}
                    <div className={`otp-timer-badge ${isExpired ? 'expired' : timeLeft <= 60 ? 'urgent' : ''}`}>
                        <Clock size={14} />
                        {isExpired
                            ? 'OTP Expired'
                            : `OTP valid for ${formatTime(timeLeft)}`}
                    </div>

                    <h2 className="otp-form-head">Verify Your Identity</h2>
                    <p className="otp-form-subhead">
                        We've sent a 6-digit code to your email address<br />
                        <strong>{email}</strong>. Please enter it below.
                    </p>

                    {/* Inline error / success messages */}
                    {error && (
                        <div className="otp-message otp-message--error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="otp-message otp-message--success">
                            <CheckCircle2 size={16} />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <form className="otp-form" onSubmit={handleSubmit}>
                        <div className="otp-inputs">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    className={`otp-input-box ${digit ? 'filled' : ''} ${isExpired ? 'expired' : ''}`}
                                    placeholder="•"
                                    disabled={isLoading || !!successMessage}
                                    autoComplete="one-time-code"
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="otp-submit-btn"
                            disabled={isLoading || !isOtpComplete || isExpired || !!successMessage}
                            style={{ opacity: (isLoading || !isOtpComplete || isExpired) ? 0.7 : 1 }}
                        >
                            {isLoading ? (
                                <span className="otp-btn-loading">
                                    <span className="otp-spinner" />
                                    Verifying...
                                </span>
                            ) : 'Verify & Proceed'}
                        </button>
                    </form>

                    <div className="resend-section">
                        <p className="resend-text">
                            Didn't receive the code?{' '}
                            <button
                                className={`resend-link-btn ${!canResend ? 'disabled' : ''}`}
                                onClick={handleResend}
                                disabled={!canResend || isResending}
                                type="button"
                            >
                                {isResending ? 'Sending...' : 'Resend Code'}
                            </button>
                        </p>
                        {!canResend && (
                            <div className="resend-badge">
                                <RefreshCw size={12} />
                                RESEND IN {formatTime(resendCooldown)}
                            </div>
                        )}
                    </div>

                    <div className="otp-bottom-links">
                        <a href="#">HELP CENTER</a>
                        <a href="#">PRIVACY POLICY</a>
                        <a href="#">TERMS</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTP;
