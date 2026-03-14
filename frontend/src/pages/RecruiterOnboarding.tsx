import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Layers, Building2, Globe, Mail, ChevronDown, MapPin, Upload, ShieldCheck,
    FileText, User, Briefcase, Linkedin, Phone, Zap, ToggleLeft, ToggleRight,
    CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Check, AlertCircle, X,
    Star, TrendingUp
} from 'lucide-react';
import { updateProfile } from '../services/recruiterApi';
import './RecruiterOnboarding.css';

// ─── Types ───────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
    // Step 1
    companyName: string;
    companyWebsite: string;
    companyEmail: string;
    industryType: string;
    companySize: string;
    companyLocation: string;
    companyLogo: File | null;
    companyLogoPreview: string;
    // Step 2
    registrationNumber: string;
    taxId: string;
    verificationDoc: File | null;
    verificationDocName: string;
    verified: boolean;
    // Step 3
    recruiterName: string;
    designation: string;
    linkedIn: string;
    workEmail: string;
    phone: string;
    profilePic: File | null;
    profilePicPreview: string;
    // Step 4
    hiringRoles: string[];
    jobType: string[];
    workMode: string[];
    experienceLevel: string;
    monthlyVolume: string;
    aiAutoScreening: boolean;
}

const INITIAL_FORM: FormData = {
    companyName: '', companyWebsite: '', companyEmail: '', industryType: '',
    companySize: '', companyLocation: '', companyLogo: null, companyLogoPreview: '',
    registrationNumber: '', taxId: '', verificationDoc: null, verificationDocName: '', verified: false,
    recruiterName: '', designation: '', linkedIn: '', workEmail: '', phone: '',
    profilePic: null, profilePicPreview: '',
    hiringRoles: [], jobType: [], workMode: [], experienceLevel: '', monthlyVolume: '',
    aiAutoScreening: true,
};

const INDUSTRIES = ['Technology', 'Finance & Banking', 'Healthcare', 'E-Commerce', 'Education',
    'Manufacturing', 'Media & Entertainment', 'Consulting', 'Real Estate', 'Other'];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'];

const ROLE_OPTIONS = ['Frontend Developer', 'Backend Developer', 'Full Stack Engineer',
    'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UI/UX Designer',
    'QA Engineer', 'Business Analyst', 'Marketing Manager', 'Sales Executive', 'HR Manager'];

const EXP_LEVELS = ['Entry Level (0–2 yrs)', 'Mid Level (2–5 yrs)', 'Senior (5–10 yrs)', 'Lead / Principal', 'VP / Director', 'C-Suite'];

const MONTHLY_VOLUMES = ['1–5 hires', '6–15 hires', '16–30 hires', '31–50 hires', '50+ hires'];

// ─── Particle Background ──────────────────────────────────────────────────────
const ParticleCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const particles: { x: number; y: number; vx: number; vy: number; alpha: number; r: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                alpha: Math.random() * 0.4 + 0.05,
                r: Math.random() * 1.5 + 0.5,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59,130,246,${p.alpha})`;
                ctx.fill();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(59,130,246,${0.06 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="ro-particles" />;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidUrl = (u: string) => {
    try { new URL(u.startsWith('http') ? u : 'https://' + u); return true; } catch { return false; }
};

// ─── Step Components ──────────────────────────────────────────────────────────

// Step 1: Company Information
const Step1 = ({ data, onChange, onNext }: {
    data: FormData;
    onChange: (key: keyof FormData, val: unknown) => void;
    onNext: () => void;
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showTooltip, setShowTooltip] = useState(false);

    const emailTip = data.companyEmail && !data.companyEmail.includes('@gmail') && !data.companyEmail.includes('@yahoo')
        && !data.companyEmail.includes('@hotmail') && isValidEmail(data.companyEmail);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.companyName.trim()) e.companyName = 'Company name is required';
        if (!data.companyWebsite.trim()) e.companyWebsite = 'Website is required';
        else if (!isValidUrl(data.companyWebsite)) e.companyWebsite = 'Enter a valid URL';
        if (!data.companyEmail.trim()) e.companyEmail = 'Company email is required';
        else if (!isValidEmail(data.companyEmail)) e.companyEmail = 'Enter a valid email address';
        if (!data.industryType) e.industryType = 'Select an industry';
        if (!data.companySize) e.companySize = 'Select company size';
        if (!data.companyLocation.trim()) e.companyLocation = 'Location is required';
        return e;
    };

    const handleNext = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        onNext();
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { onChange('companyLogoPreview', ev.target?.result as string); };
        reader.readAsDataURL(file);
        onChange('companyLogo', file);
    };

    const field = (key: keyof FormData) => errors[key] ? 'ro-input ro-input-error' : 'ro-input';

    return (
        <div className="ro-step-content slide-in">
            <div className="ro-step-header">
                <div className="ro-step-icon-wrap blue">
                    <Building2 size={22} />
                </div>
                <div>
                    <h2 className="ro-step-title">Company Information</h2>
                    <p className="ro-step-sub">Tell us about your organization to get started</p>
                </div>
            </div>

            <div className="ro-form-grid">
                {/* Company Name */}
                <div className="ro-field-group">
                    <label className="ro-label">Company Name <span className="ro-req">*</span></label>
                    <input
                        className={field('companyName')}
                        placeholder="Acme Technologies"
                        value={data.companyName}
                        onChange={e => { onChange('companyName', e.target.value); setErrors(p => ({ ...p, companyName: '' })); }}
                    />
                    {errors.companyName && <span className="ro-error"><AlertCircle size={12} /> {errors.companyName}</span>}
                </div>

                {/* Company Website */}
                <div className="ro-field-group">
                    <label className="ro-label"><Globe size={13} className="ro-label-icon" /> Company Website <span className="ro-req">*</span></label>
                    <input
                        className={field('companyWebsite')}
                        placeholder="www.acmetech.com"
                        value={data.companyWebsite}
                        onChange={e => { onChange('companyWebsite', e.target.value); setErrors(p => ({ ...p, companyWebsite: '' })); }}
                    />
                    {errors.companyWebsite && <span className="ro-error"><AlertCircle size={12} /> {errors.companyWebsite}</span>}
                </div>

                {/* Company Email */}
                <div className="ro-field-group" style={{ position: 'relative' }}>
                    <label className="ro-label"><Mail size={13} className="ro-label-icon" /> Company Email <span className="ro-req">*</span></label>
                    <div className="ro-input-wrap">
                        <input
                            className={field('companyEmail')}
                            placeholder="hello@acmetech.com"
                            type="email"
                            value={data.companyEmail}
                            onChange={e => { onChange('companyEmail', e.target.value); setErrors(p => ({ ...p, companyEmail: '' })); }}
                            onFocus={() => setShowTooltip(true)}
                            onBlur={() => setShowTooltip(false)}
                        />
                        {emailTip && <span className="ro-ai-check"><Sparkles size={13} /></span>}
                    </div>
                    {showTooltip && (
                        <div className="ro-ai-tooltip">
                            <Sparkles size={12} /> Professional domain email increases trust score
                        </div>
                    )}
                    {errors.companyEmail && <span className="ro-error"><AlertCircle size={12} /> {errors.companyEmail}</span>}
                </div>

                {/* Industry */}
                <div className="ro-field-group">
                    <label className="ro-label">Industry Type <span className="ro-req">*</span></label>
                    <div className="ro-select-wrap">
                        <select
                            className={field('industryType')}
                            value={data.industryType}
                            onChange={e => { onChange('industryType', e.target.value); setErrors(p => ({ ...p, industryType: '' })); }}
                        >
                            <option value="">Select industry…</option>
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                        <ChevronDown size={16} className="ro-select-chevron" />
                    </div>
                    {errors.industryType && <span className="ro-error"><AlertCircle size={12} /> {errors.industryType}</span>}
                </div>

                {/* Company Size */}
                <div className="ro-field-group">
                    <label className="ro-label">Company Size <span className="ro-req">*</span></label>
                    <div className="ro-select-wrap">
                        <select
                            className={field('companySize')}
                            value={data.companySize}
                            onChange={e => { onChange('companySize', e.target.value); setErrors(p => ({ ...p, companySize: '' })); }}
                        >
                            <option value="">Select size…</option>
                            {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                        </select>
                        <ChevronDown size={16} className="ro-select-chevron" />
                    </div>
                    {errors.companySize && <span className="ro-error"><AlertCircle size={12} /> {errors.companySize}</span>}
                </div>

                {/* Location */}
                <div className="ro-field-group">
                    <label className="ro-label"><MapPin size={13} className="ro-label-icon" /> Company Location <span className="ro-req">*</span></label>
                    <input
                        className={field('companyLocation')}
                        placeholder="Bangalore, India"
                        value={data.companyLocation}
                        onChange={e => { onChange('companyLocation', e.target.value); setErrors(p => ({ ...p, companyLocation: '' })); }}
                    />
                    {errors.companyLocation && <span className="ro-error"><AlertCircle size={12} /> {errors.companyLocation}</span>}
                </div>
            </div>

            {/* Logo Upload */}
            <div className="ro-field-group ro-full-width">
                <label className="ro-label">Company Logo</label>
                <div className="ro-upload-zone" onClick={() => document.getElementById('logo-upload')?.click()}>
                    {data.companyLogoPreview
                        ? <img src={data.companyLogoPreview} alt="logo" className="ro-logo-preview" />
                        : <>
                            <Upload size={22} className="ro-upload-icon" />
                            <p className="ro-upload-text">Click to upload logo</p>
                            <p className="ro-upload-hint">PNG, JPG up to 5MB</p>
                        </>}
                </div>
                <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </div>

            <div className="ro-step-actions">
                <button className="ro-btn-primary" onClick={handleNext}>
                    Next: Verify Company <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Step 2: Company Verification
const Step2 = ({ data, onChange, onBack, onNext }: {
    data: FormData;
    onChange: (key: keyof FormData, val: unknown) => void;
    onBack: () => void;
    onNext: () => void;
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(data.verified);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.registrationNumber.trim()) e.registrationNumber = 'Registration number is required';
        if (!data.taxId.trim()) e.taxId = 'Tax ID is required';
        if (!data.verificationDoc) e.verificationDoc = 'Please upload a verification document';
        return e;
    };

    const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onChange('verificationDoc', file);
        onChange('verificationDocName', file.name);
        setErrors(p => ({ ...p, verificationDoc: '' }));
        // Simulate verification
        setVerifying(true);
        setVerified(false);
        onChange('verified', false);
        setTimeout(() => {
            setVerifying(false);
            setVerified(true);
            onChange('verified', true);
        }, 2200);
    };

    const handleNext = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        onNext();
    };

    return (
        <div className="ro-step-content slide-in">
            <div className="ro-step-header">
                <div className="ro-step-icon-wrap purple">
                    <ShieldCheck size={22} />
                </div>
                <div>
                    <h2 className="ro-step-title">Company Verification</h2>
                    <p className="ro-step-sub">Verify your business credentials to build trust</p>
                </div>
            </div>

            <div className="ro-form-grid">
                <div className="ro-field-group">
                    <label className="ro-label">Business Registration Number <span className="ro-req">*</span></label>
                    <input
                        className={errors.registrationNumber ? 'ro-input ro-input-error' : 'ro-input'}
                        placeholder="e.g. U72200MH2021PTC123456"
                        value={data.registrationNumber}
                        onChange={e => { onChange('registrationNumber', e.target.value); setErrors(p => ({ ...p, registrationNumber: '' })); }}
                    />
                    {errors.registrationNumber && <span className="ro-error"><AlertCircle size={12} /> {errors.registrationNumber}</span>}
                </div>

                <div className="ro-field-group">
                    <label className="ro-label">GST / Tax ID <span className="ro-req">*</span></label>
                    <input
                        className={errors.taxId ? 'ro-input ro-input-error' : 'ro-input'}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        value={data.taxId}
                        onChange={e => { onChange('taxId', e.target.value); setErrors(p => ({ ...p, taxId: '' })); }}
                    />
                    {errors.taxId && <span className="ro-error"><AlertCircle size={12} /> {errors.taxId}</span>}
                </div>
            </div>

            {/* Document Upload */}
            <div className="ro-field-group ro-full-width">
                <label className="ro-label">Verification Document (PDF) <span className="ro-req">*</span></label>
                <div
                    className={`ro-upload-zone ro-doc-zone ${errors.verificationDoc ? 'upload-error' : ''}`}
                    onClick={() => document.getElementById('doc-upload')?.click()}
                >
                    {verifying && (
                        <div className="ro-verifying">
                            <div className="ro-spinner" />
                            <p>Analyzing document with AI…</p>
                        </div>
                    )}
                    {!verifying && verified && (
                        <div className="ro-verified-state">
                            <div className="ro-verified-icon"><CheckCircle2 size={28} /></div>
                            <p className="ro-verified-filename">{data.verificationDocName}</p>
                            <div className="ro-confidence-badge">
                                <Sparkles size={12} /> Verification Confidence: High
                            </div>
                        </div>
                    )}
                    {!verifying && !verified && (
                        <>
                            <FileText size={24} className="ro-upload-icon" />
                            <p className="ro-upload-text">Click to upload PDF document</p>
                            <p className="ro-upload-hint">Business license, incorporation cert, or tax document</p>
                        </>
                    )}
                </div>
                <input id="doc-upload" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleDocUpload} />
                {errors.verificationDoc && <span className="ro-error"><AlertCircle size={12} /> {errors.verificationDoc}</span>}
            </div>

            <div className="ro-step-actions">
                <button className="ro-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
                <button className="ro-btn-primary" onClick={handleNext}>
                    Next: Recruiter Profile <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Step 3: Recruiter Profile
const Step3 = ({ data, onChange, onBack, onNext }: {
    data: FormData;
    onChange: (key: keyof FormData, val: unknown) => void;
    onBack: () => void;
    onNext: () => void;
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Trust meter score
    const fields = [data.recruiterName, data.designation, data.linkedIn, data.workEmail, data.phone];
    const filled = fields.filter(f => f.trim().length > 0).length;
    const trustScore = Math.round(((filled + (data.profilePic ? 1 : 0)) / 6) * 100);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.recruiterName.trim()) e.recruiterName = 'Your name is required';
        if (!data.designation.trim()) e.designation = 'Designation is required';
        if (!data.workEmail.trim()) e.workEmail = 'Work email is required';
        else if (!isValidEmail(data.workEmail)) e.workEmail = 'Enter a valid email';
        if (!data.phone.trim()) e.phone = 'Phone number is required';
        else if (!/^[+\d\s\-()]{7,15}$/.test(data.phone)) e.phone = 'Enter a valid phone number';
        return e;
    };

    const handlePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { onChange('profilePicPreview', ev.target?.result as string); };
        reader.readAsDataURL(file);
        onChange('profilePic', file);
    };

    const handleNext = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        onNext();
    };

    const trustColor = trustScore < 40 ? '#ef4444' : trustScore < 70 ? '#f59e0b' : '#10b981';

    return (
        <div className="ro-step-content slide-in">
            <div className="ro-step-header">
                <div className="ro-step-icon-wrap green">
                    <User size={22} />
                </div>
                <div>
                    <h2 className="ro-step-title">Recruiter Profile</h2>
                    <p className="ro-step-sub">Set up your professional identity on ProvaHire</p>
                </div>
            </div>

            {/* Profile pic + Trust meter row */}
            <div className="ro-profile-row">
                <div className="ro-avatar-upload-wrap" onClick={() => document.getElementById('pic-upload')?.click()}>
                    <div className="ro-avatar-circle">
                        {data.profilePicPreview
                            ? <img src={data.profilePicPreview} alt="profile" className="ro-avatar-img" />
                            : <User size={32} className="ro-avatar-placeholder" />}
                    </div>
                    <span className="ro-avatar-label">Upload Photo</span>
                    <input id="pic-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicUpload} />
                </div>

                <div className="ro-trust-meter">
                    <div className="ro-trust-header">
                        <Star size={14} className="ro-trust-icon" />
                        <span className="ro-trust-label">AI Trust Score</span>
                        <span className="ro-trust-pct" style={{ color: trustColor }}>{trustScore}%</span>
                    </div>
                    <div className="ro-trust-bar-bg">
                        <div
                            className="ro-trust-bar-fill"
                            style={{ width: `${trustScore}%`, background: trustColor, transition: 'width 0.5s ease, background 0.5s ease' }}
                        />
                    </div>
                    <p className="ro-trust-hint">
                        {trustScore < 50 ? 'Fill in more fields to increase your trust score' :
                            trustScore < 80 ? 'Looking good! Add more details to maximize trust' :
                                'Excellent! High trust score attracts quality candidates'}
                    </p>
                </div>
            </div>

            <div className="ro-form-grid">
                <div className="ro-field-group">
                    <label className="ro-label">Full Name <span className="ro-req">*</span></label>
                    <input
                        className={errors.recruiterName ? 'ro-input ro-input-error' : 'ro-input'}
                        placeholder="Sarah Johnson"
                        value={data.recruiterName}
                        onChange={e => { onChange('recruiterName', e.target.value); setErrors(p => ({ ...p, recruiterName: '' })); }}
                    />
                    {errors.recruiterName && <span className="ro-error"><AlertCircle size={12} /> {errors.recruiterName}</span>}
                </div>

                <div className="ro-field-group">
                    <label className="ro-label"><Briefcase size={13} className="ro-label-icon" /> Designation <span className="ro-req">*</span></label>
                    <input
                        className={errors.designation ? 'ro-input ro-input-error' : 'ro-input'}
                        placeholder="Senior Talent Acquisition Lead"
                        value={data.designation}
                        onChange={e => { onChange('designation', e.target.value); setErrors(p => ({ ...p, designation: '' })); }}
                    />
                    {errors.designation && <span className="ro-error"><AlertCircle size={12} /> {errors.designation}</span>}
                </div>

                <div className="ro-field-group">
                    <label className="ro-label"><Linkedin size={13} className="ro-label-icon" /> LinkedIn Profile</label>
                    <input
                        className="ro-input"
                        placeholder="linkedin.com/in/yourprofile"
                        value={data.linkedIn}
                        onChange={e => onChange('linkedIn', e.target.value)}
                    />
                </div>

                <div className="ro-field-group">
                    <label className="ro-label"><Mail size={13} className="ro-label-icon" /> Work Email <span className="ro-req">*</span></label>
                    <input
                        className={errors.workEmail ? 'ro-input ro-input-error' : 'ro-input'}
                        placeholder="sarah@acmetech.com"
                        type="email"
                        value={data.workEmail}
                        onChange={e => { onChange('workEmail', e.target.value); setErrors(p => ({ ...p, workEmail: '' })); }}
                    />
                    {errors.workEmail && <span className="ro-error"><AlertCircle size={12} /> {errors.workEmail}</span>}
                </div>

                <div className="ro-field-group">
                    <label className="ro-label"><Phone size={13} className="ro-label-icon" /> Phone Number <span className="ro-req">*</span></label>
                    <input
                        className={errors.phone ? 'ro-input ro-input-error' : 'ro-input'}
                        placeholder="+91 98765 43210"
                        value={data.phone}
                        onChange={e => { onChange('phone', e.target.value); setErrors(p => ({ ...p, phone: '' })); }}
                    />
                    {errors.phone && <span className="ro-error"><AlertCircle size={12} /> {errors.phone}</span>}
                </div>
            </div>

            <div className="ro-step-actions">
                <button className="ro-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
                <button className="ro-btn-primary" onClick={handleNext}>
                    Next: Hiring Preferences <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Step 4: Hiring Preferences
const Step4 = ({ data, onChange, onBack, onNext }: {
    data: FormData;
    onChange: (key: keyof FormData, val: unknown) => void;
    onBack: () => void;
    onNext: () => void;
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [roleInput, setRoleInput] = useState('');

    const toggleMulti = (key: 'jobType' | 'workMode', val: string) => {
        const arr = data[key] as string[];
        const updated = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
        onChange(key, updated);
        setErrors(p => ({ ...p, [key]: '' }));
    };

    const addRole = (role: string) => {
        if (!role || data.hiringRoles.includes(role)) return;
        onChange('hiringRoles', [...data.hiringRoles, role]);
        setRoleInput('');
        setErrors(p => ({ ...p, hiringRoles: '' }));
    };

    const removeRole = (role: string) => {
        onChange('hiringRoles', data.hiringRoles.filter(r => r !== role));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.hiringRoles.length) e.hiringRoles = 'Select at least one hiring role';
        if (!data.jobType.length) e.jobType = 'Select at least one job type';
        if (!data.workMode.length) e.workMode = 'Select at least one work mode';
        if (!data.experienceLevel) e.experienceLevel = 'Select experience level';
        if (!data.monthlyVolume) e.monthlyVolume = 'Select monthly hiring volume';
        return e;
    };

    const handleNext = () => {
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        onNext();
    };

    return (
        <div className="ro-step-content slide-in">
            <div className="ro-step-header">
                <div className="ro-step-icon-wrap gold">
                    <TrendingUp size={22} />
                </div>
                <div>
                    <h2 className="ro-step-title">Hiring Preferences</h2>
                    <p className="ro-step-sub">Configure your team's hiring requirements</p>
                </div>
            </div>

            {/* Hiring Roles */}
            <div className="ro-field-group ro-full-width">
                <label className="ro-label">Hiring Roles <span className="ro-req">*</span></label>
                <div className="ro-tag-input-wrap">
                    {data.hiringRoles.map(r => (
                        <span key={r} className="ro-tag">
                            {r} <button className="ro-tag-remove" onClick={() => removeRole(r)}><X size={11} /></button>
                        </span>
                    ))}
                    <div className="ro-role-dropdown-wrap">
                        <input
                            className="ro-tag-input"
                            placeholder={data.hiringRoles.length ? 'Add more roles…' : 'Search or select roles…'}
                            value={roleInput}
                            onChange={e => setRoleInput(e.target.value)}
                        />
                        {roleInput && (
                            <div className="ro-role-dropdown">
                                {ROLE_OPTIONS.filter(r => r.toLowerCase().includes(roleInput.toLowerCase()) && !data.hiringRoles.includes(r))
                                    .map(r => (
                                        <div key={r} className="ro-role-option" onClick={() => addRole(r)}>{r}</div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="ro-role-suggestions">
                    {ROLE_OPTIONS.slice(0, 6).filter(r => !data.hiringRoles.includes(r)).map(r => (
                        <button key={r} className="ro-role-chip" onClick={() => addRole(r)}>{r}</button>
                    ))}
                </div>
                {errors.hiringRoles && <span className="ro-error"><AlertCircle size={12} /> {errors.hiringRoles}</span>}
            </div>

            {/* Job Type */}
            <div className="ro-field-group ro-full-width">
                <label className="ro-label">Job Type <span className="ro-req">*</span></label>
                <div className="ro-toggle-cards">
                    {['Full Time', 'Internship', 'Contract', 'Freelance'].map(t => (
                        <div
                            key={t}
                            className={`ro-toggle-card ${data.jobType.includes(t) ? 'active' : ''}`}
                            onClick={() => toggleMulti('jobType', t)}
                        >
                            {data.jobType.includes(t) && <Check size={12} className="ro-toggle-check" />}
                            {t}
                        </div>
                    ))}
                </div>
                {errors.jobType && <span className="ro-error"><AlertCircle size={12} /> {errors.jobType}</span>}
            </div>

            {/* Work Mode */}
            <div className="ro-field-group ro-full-width">
                <label className="ro-label">Work Mode <span className="ro-req">*</span></label>
                <div className="ro-toggle-cards">
                    {['Remote', 'Hybrid', 'Onsite'].map(m => (
                        <div
                            key={m}
                            className={`ro-toggle-card ${data.workMode.includes(m) ? 'active' : ''}`}
                            onClick={() => toggleMulti('workMode', m)}
                        >
                            {data.workMode.includes(m) && <Check size={12} className="ro-toggle-check" />}
                            {m}
                        </div>
                    ))}
                </div>
                {errors.workMode && <span className="ro-error"><AlertCircle size={12} /> {errors.workMode}</span>}
            </div>

            <div className="ro-form-grid">
                <div className="ro-field-group">
                    <label className="ro-label">Preferred Experience Level <span className="ro-req">*</span></label>
                    <div className="ro-select-wrap">
                        <select
                            className={errors.experienceLevel ? 'ro-input ro-input-error' : 'ro-input'}
                            value={data.experienceLevel}
                            onChange={e => { onChange('experienceLevel', e.target.value); setErrors(p => ({ ...p, experienceLevel: '' })); }}
                        >
                            <option value="">Select level…</option>
                            {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <ChevronDown size={16} className="ro-select-chevron" />
                    </div>
                    {errors.experienceLevel && <span className="ro-error"><AlertCircle size={12} /> {errors.experienceLevel}</span>}
                </div>

                <div className="ro-field-group">
                    <label className="ro-label">Monthly Hiring Volume <span className="ro-req">*</span></label>
                    <div className="ro-select-wrap">
                        <select
                            className={errors.monthlyVolume ? 'ro-input ro-input-error' : 'ro-input'}
                            value={data.monthlyVolume}
                            onChange={e => { onChange('monthlyVolume', e.target.value); setErrors(p => ({ ...p, monthlyVolume: '' })); }}
                        >
                            <option value="">Select volume…</option>
                            {MONTHLY_VOLUMES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                        <ChevronDown size={16} className="ro-select-chevron" />
                    </div>
                    {errors.monthlyVolume && <span className="ro-error"><AlertCircle size={12} /> {errors.monthlyVolume}</span>}
                </div>
            </div>

            {/* AI Recommendation Panel */}
            <div className="ro-ai-panel">
                <div className="ro-ai-panel-top">
                    <div className="ro-ai-panel-icon"><Sparkles size={16} /></div>
                    <div>
                        <p className="ro-ai-panel-title">AI Recommendation</p>
                        <p className="ro-ai-panel-text">
                            Based on your hiring needs, we recommend enabling <strong>AI Smart Matching</strong> to automatically rank candidates by fit score.
                        </p>
                    </div>
                </div>
                <div className="ro-ai-toggle-row">
                    <div>
                        <p className="ro-ai-toggle-label">Enable AI Auto-Screening</p>
                        <p className="ro-ai-toggle-sub">Automatically screen and rank applicants using AI</p>
                    </div>
                    <button
                        className={`ro-toggle-switch ${data.aiAutoScreening ? 'on' : ''}`}
                        onClick={() => onChange('aiAutoScreening', !data.aiAutoScreening)}
                    >
                        {data.aiAutoScreening ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                </div>
            </div>

            <div className="ro-step-actions">
                <button className="ro-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
                <button className="ro-btn-primary" onClick={handleNext}>
                    Next: Review & Activate <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Step 5: Review & Activate
const Step5 = ({ data, onBack, onGoTo }: {
    data: FormData;
    onBack: () => void;
    onGoTo: (step: Step) => void;
}) => {
    const [activating, setActivating] = useState(false);
    const [activated, setActivated] = useState(false);

    const handleActivate = async () => {
        setActivating(true);
        try {
            await updateProfile({
                fullName: data.recruiterName,
                company: data.companyName,
                companyWebsite: data.companyWebsite,
                companyEmail: data.companyEmail,
                industryType: data.industryType,
                companySize: data.companySize,
                companyLocation: data.companyLocation,
                companyLogo: data.companyLogoPreview,
                designation: data.designation,
                phone: data.phone,
                linkedIn: data.linkedIn,
                workEmail: data.workEmail,
                profilePic: data.profilePicPreview,
                hiringRoles: data.hiringRoles,
                jobType: data.jobType,
                workMode: data.workMode,
                experienceLevel: data.experienceLevel,
                monthlyVolume: data.monthlyVolume,
                aiAutoScreening: data.aiAutoScreening,
                onboardingDone: true
            });
            setActivating(false);
            setActivated(true);
            setTimeout(() => {
                window.location.hash = '#/recruiter/dashboard';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
            }, 2000);
        } catch (error) {
            console.error('Failed to activate profile:', error);
            setActivating(false);
            alert('Failed to activate account. Please try again.');
        }
    };

    if (activated) {
        return (
            <div className="ro-step-content slide-in ro-success-screen">
                <div className="ro-success-ring">
                    <CheckCircle2 size={52} />
                </div>
                <h2 className="ro-success-title">Account Activated!</h2>
                <p className="ro-success-sub">Your recruiter profile is live. Redirecting to your dashboard…</p>
                <div className="ro-success-dots">
                    <div className="ro-dot" /><div className="ro-dot" /><div className="ro-dot" />
                </div>
            </div>
        );
    }

    return (
        <div className="ro-step-content slide-in">
            <div className="ro-step-header">
                <div className="ro-step-icon-wrap blue">
                    <Zap size={22} />
                </div>
                <div>
                    <h2 className="ro-step-title">Review & Activate</h2>
                    <p className="ro-step-sub">Everything looks good? Let's launch your recruiter account</p>
                </div>
            </div>

            {/* Completion bar */}
            <div className="ro-completion-bar-wrap">
                <div className="ro-completion-header">
                    <span className="ro-completion-label">Profile Completion</span>
                    <span className="ro-completion-pct">100%</span>
                </div>
                <div className="ro-completion-bg">
                    <div className="ro-completion-fill" style={{ width: '100%' }} />
                </div>
            </div>

            {/* Summary sections */}
            <div className="ro-summary-grid">
                {/* Company Details */}
                <div className="ro-summary-card">
                    <div className="ro-summary-card-hdr">
                        <Building2 size={15} />
                        <span>Company Details</span>
                        <button className="ro-edit-btn" onClick={() => onGoTo(1)}>Edit</button>
                    </div>
                    <div className="ro-summary-rows">
                        <div className="ro-summary-row"><span>Name</span><span>{data.companyName || '—'}</span></div>
                        <div className="ro-summary-row"><span>Website</span><span>{data.companyWebsite || '—'}</span></div>
                        <div className="ro-summary-row"><span>Email</span><span>{data.companyEmail || '—'}</span></div>
                        <div className="ro-summary-row"><span>Industry</span><span>{data.industryType || '—'}</span></div>
                        <div className="ro-summary-row"><span>Size</span><span>{data.companySize ? data.companySize + ' employees' : '—'}</span></div>
                        <div className="ro-summary-row"><span>Location</span><span>{data.companyLocation || '—'}</span></div>
                    </div>
                </div>

                {/* Recruiter Info */}
                <div className="ro-summary-card">
                    <div className="ro-summary-card-hdr">
                        <User size={15} />
                        <span>Recruiter Info</span>
                        <button className="ro-edit-btn" onClick={() => onGoTo(3)}>Edit</button>
                    </div>
                    <div className="ro-summary-rows">
                        <div className="ro-summary-row"><span>Name</span><span>{data.recruiterName || '—'}</span></div>
                        <div className="ro-summary-row"><span>Designation</span><span>{data.designation || '—'}</span></div>
                        <div className="ro-summary-row"><span>Email</span><span>{data.workEmail || '—'}</span></div>
                        <div className="ro-summary-row"><span>Phone</span><span>{data.phone || '—'}</span></div>
                        {data.linkedIn && <div className="ro-summary-row"><span>LinkedIn</span><span>{data.linkedIn}</span></div>}
                    </div>
                </div>

                {/* Hiring Preferences */}
                <div className="ro-summary-card">
                    <div className="ro-summary-card-hdr">
                        <TrendingUp size={15} />
                        <span>Hiring Preferences</span>
                        <button className="ro-edit-btn" onClick={() => onGoTo(4)}>Edit</button>
                    </div>
                    <div className="ro-summary-rows">
                        <div className="ro-summary-row"><span>Roles</span><span>{data.hiringRoles.slice(0, 3).join(', ')}{data.hiringRoles.length > 3 ? ` +${data.hiringRoles.length - 3}` : ''}</span></div>
                        <div className="ro-summary-row"><span>Job Type</span><span>{data.jobType.join(', ') || '—'}</span></div>
                        <div className="ro-summary-row"><span>Work Mode</span><span>{data.workMode.join(', ') || '—'}</span></div>
                        <div className="ro-summary-row"><span>Experience</span><span>{data.experienceLevel || '—'}</span></div>
                        <div className="ro-summary-row"><span>Volume</span><span>{data.monthlyVolume || '—'}</span></div>
                        <div className="ro-summary-row"><span>AI Screening</span><span className={data.aiAutoScreening ? 'ro-badge-on' : 'ro-badge-off'}>{data.aiAutoScreening ? 'Enabled' : 'Disabled'}</span></div>
                    </div>
                </div>

                {/* Verification Status */}
                <div className="ro-summary-card">
                    <div className="ro-summary-card-hdr">
                        <ShieldCheck size={15} />
                        <span>Verification Status</span>
                        <button className="ro-edit-btn" onClick={() => onGoTo(2)}>Edit</button>
                    </div>
                    <div className="ro-summary-rows">
                        <div className="ro-summary-row"><span>Reg. Number</span><span>{data.registrationNumber || '—'}</span></div>
                        <div className="ro-summary-row"><span>Tax ID</span><span>{data.taxId || '—'}</span></div>
                        <div className="ro-summary-row">
                            <span>Document</span>
                            <span className={data.verified ? 'ro-badge-on' : 'ro-badge-pending'}>
                                {data.verified ? '✓ Verified' : data.verificationDocName ? 'Uploaded' : 'Not uploaded'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="ro-step-actions ro-activate-actions">
                <button className="ro-btn-ghost" onClick={onBack}><ArrowLeft size={16} /> Back</button>
                <button
                    className={`ro-btn-activate ${activating ? 'loading' : ''}`}
                    onClick={handleActivate}
                    disabled={activating}
                >
                    {activating ? (
                        <><div className="ro-btn-spinner" /> Activating Account…</>
                    ) : (
                        <><Zap size={16} /> Activate Recruiter Account</>
                    )}
                </button>
            </div>
        </div>
    );
};

// ─── Main Orchestrator ────────────────────────────────────────────────────────
const RecruiterOnboarding = () => {
    const [step, setStep] = useState<Step>(1);
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const setField = useCallback((key: keyof FormData, val: unknown) => {
        setFormData(prev => ({ ...prev, [key]: val }));
    }, []);

    const goTo = (s: Step) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(s);
    };

    const stepLabels = ['Company Info', 'Verification', 'Recruiter Profile', 'Hiring Preferences', 'Review & Activate'];

    return (
        <div className="ro-root">
            <ParticleCanvas />

            {/* Navbar */}
            <nav className="ro-nav">
                <div className="ro-nav-logo">
                    <div className="ro-logo-icon"><Layers size={18} /></div>
                    <span className="ro-logo-text">ProvaHire</span>
                </div>
                <div className="ro-nav-steps">
                    {stepLabels.map((label, i) => {
                        const num = (i + 1) as Step;
                        const isActive = step === num;
                        const isDone = step > num;
                        return (
                            <div key={i} className={`ro-nav-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                <div className="ro-nav-step-dot">
                                    {isDone ? <Check size={10} /> : <span>{num}</span>}
                                </div>
                                <span className="ro-nav-step-label">{label}</span>
                                {i < stepLabels.length - 1 && <div className={`ro-nav-step-line ${isDone ? 'done' : ''}`} />}
                            </div>
                        );
                    })}
                </div>
                <div className="ro-nav-progress">Step {step} of 5</div>
            </nav>

            {/* Card */}
            <main className="ro-main">
                <div className="ro-card">
                    <div className="ro-card-glow" />
                    {/* Progress strip */}
                    <div className="ro-progress-strip">
                        <div className="ro-progress-strip-fill" style={{ width: `${(step / 5) * 100}%` }} />
                    </div>

                    {step === 1 && <Step1 data={formData} onChange={setField} onNext={() => goTo(2)} />}
                    {step === 2 && <Step2 data={formData} onChange={setField} onBack={() => goTo(1)} onNext={() => goTo(3)} />}
                    {step === 3 && <Step3 data={formData} onChange={setField} onBack={() => goTo(2)} onNext={() => goTo(4)} />}
                    {step === 4 && <Step4 data={formData} onChange={setField} onBack={() => goTo(3)} onNext={() => goTo(5)} />}
                    {step === 5 && <Step5 data={formData} onBack={() => goTo(4)} onGoTo={goTo} />}
                </div>
            </main>
        </div>
    );
};

export default RecruiterOnboarding;
