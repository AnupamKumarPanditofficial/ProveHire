import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Pencil, LogOut, Share2, Plus, X, Check, Upload,
    Eye, Award, FileText, Trash2, MapPin, Mail, Link,
    Briefcase, Zap, Shield, Star,
    Camera, User, Users, TrendingUp, ExternalLink
} from 'lucide-react';
import CandidateHeader from '../components/CandidateHeader';
import { API_BASE_URL } from '../globalConfig';
import { getProfile, saveProfile, getAuthUser } from '../utils/profileStore';
import type { StoredProfile } from '../utils/profileStore';
import './CandidateProfile.css';

// ── Types ──────────────────────────────────────────────────────
type Skill = StoredProfile['skills'][number];
type Cert = StoredProfile['certs'][number];

interface Toast { id: number; msg: string; }

// ── Constants ──────────────────────────────────────────────────
const LEVEL_COLOR: Record<string, string> = {
    Beginner: '#06b6d4', Intermediate: '#8b5cf6', Advanced: '#3b82f6', Expert: '#10b981',
};
const CERT_ICONS = ['☁️', '🔐', '📋', '⚙️', '📊', '🏆', '💡', '🌐'];
const CERT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// ── Completion score ───────────────────────────────────────────
function calcCompletion(p: StoredProfile) {
    let s = 0;
    if (p.name) s += 15;
    if (p.title) s += 10;
    if (p.email) s += 10;
    if (p.location) s += 8;
    if (p.portfolio) s += 7;
    if (p.bio && p.bio.length > 20) s += 10;
    if (p.avatarUrl) s += 10;
    if (p.skills.length >= 1) s += 10;
    if (p.skills.length >= 3) s += 5;
    if (p.certs.length >= 1) s += 10;
    if (p.resume) s += 5;
    return Math.min(s, 100);
}

// ── Ring ───────────────────────────────────────────────────────
const Ring = ({ pct }: { pct: number }) => {
    const r = 52; const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const label = pct >= 90 ? 'Almost complete!' : pct >= 70 ? 'Looking great!' : pct >= 50 ? 'Keep going!' : 'Get started';
    const color = pct >= 80 ? '#3b82f6' : pct >= 60 ? '#8b5cf6' : '#f59e0b';
    return (
        <div className="pg-ring-wrap">
            <svg className="pg-ring-svg" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={r} className="pg-ring-track" />
                <circle cx="60" cy="60" r={r} className="pg-ring-fill"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ / 4} style={{ stroke: color }} />
            </svg>
            <div className="pg-ring-inner">
                <span className="pg-ring-pct">{pct}%</span>
                <span className="pg-ring-label">STRENGTH</span>
            </div>
            <p className="pg-ring-sub">{label}</p>
        </div>
    );
};

// ── SkillBar ───────────────────────────────────────────────────
const SkillBar = ({ skill, animated }: { skill: Skill; animated: boolean }) => (
    <div className="pg-skill-card">
        <div className="pg-skill-top">
            <div>
                <p className="pg-skill-name">{skill.name || (skill as any).skillName}</p>
                <p className="pg-skill-level" style={{ color: LEVEL_COLOR[skill.level || 'Intermediate'] ?? '#94a3b8' }}>{(skill.level || 'verified').toUpperCase()}</p>
            </div>
            <div className="pg-skill-right">
                <span className="pg-skill-pct">{skill.pct || (skill as any).score}%</span>
            </div>
        </div>
        <div className="pg-skill-track">
            <div className="pg-skill-fill"
                style={{ width: animated ? `${skill.pct || (skill as any).score}%` : '0%', background: `linear-gradient(90deg, ${LEVEL_COLOR[skill.level || 'Intermediate'] ?? '#3b82f6'}, ${LEVEL_COLOR[skill.level || 'Intermediate'] ?? '#3b82f6'}aa)` }} />
        </div>
    </div>
);

// ── Toast ──────────────────────────────────────────────────────
const Toaster = ({ toasts }: { toasts: Toast[] }) => (
    <div className="pg-toaster">
        {toasts.map(t => <div key={t.id} className="pg-toast"><Check size={14} /> {t.msg}</div>)}
    </div>
);

// ── Modal ──────────────────────────────────────────────────────
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => {
    useEffect(() => {
        const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);
    return (
        <div className="pg-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="pg-modal">{children}</div>
        </div>
    );
};

// ── Main ───────────────────────────────────────────────────────
interface Props { onNavigate: (p: string) => void; }

const CandidateProfile = ({ onNavigate }: Props) => {
    const [stored, setStored] = useState<StoredProfile>(getProfile());
    const [animateBars, setAnimateBars] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const isRecruiter = getAuthUser()?.role === 'recruiter';
    const [previewMode, setPreviewMode] = useState(isRecruiter);
    const toastId = useRef(0);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showAddCert, setShowAddCert] = useState(false);
    const [showEditBio, setShowEditBio] = useState(false);

    const [editForm, setEditForm] = useState({ name: '', title: '', exp: '', email: '', location: '', portfolio: '' });
    const [newCert, setNewCert] = useState<Omit<Cert, 'id'>>({ name: '', issuer: '', year: '', icon: '🏆', color: '#3b82f6', url: '' });
    const [bioEdit, setBioEdit] = useState('');

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const resumeInputRef = useRef<HTMLInputElement>(null);

    const completion = calcCompletion(stored);

    const fetchProfileData = useCallback(async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            const res = await fetch(`${API_BASE_URL}/api/candidate/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.profile) {
                const db = data.profile;
                const updated: Partial<StoredProfile> = {
                    name: db.fullName || db.education?.fullName || '',
                    email: db.email || '',
                    targetRole: db.targetRole || '',
                    degree: db.education?.degree || '',
                    university: db.education?.university || '',
                    passingYear: db.education?.passingYear || '',
                    engagement: db.careerPreferences?.engagement || 'job',
                    location: db.careerPreferences?.preferredLocation || '',
                    title: db.careerPreferences?.preferredRole || '',
                    industries: db.careerPreferences?.industries || [],
                    certs: (db.certificates || []).map((c: any, i: number) => ({
                        id: i,
                        name: c.name,
                        issuer: 'Verified Issuer',
                        year: c.uploadedAt ? new Date(c.uploadedAt).getFullYear().toString() : '',
                        icon: '🏆',
                        color: '#3b82f6',
                        url: c.link || c.fileUrl || ''
                    })),
                    onboardingDone: true,
                    skillScore: db.scores?.skillScore || null,
                    resumeScore: db.scores?.resumeScore || null,
                    testScore: db.scores?.testScore || null,
                    hireScore: db.scores?.hireScore || null,
                    verifiedSkills: db.verifiedSkills || []
                };
                setStored(prev => ({ ...prev, ...updated }));
                saveProfile(updated);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }, []);

    useEffect(() => {
        fetchProfileData();
        const t = setTimeout(() => setAnimateBars(true), 300);
        return () => clearTimeout(t);
    }, [fetchProfileData]);

    const persist = useCallback(async (updates: Partial<StoredProfile>) => {
        const next = saveProfile(updates);
        setStored({ ...next });

        // Sync to Backend
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            // Prepare backend payload
            const payload: any = {};
            if (updates.name || updates.degree || updates.university || updates.passingYear) {
                payload.education = {
                    fullName: updates.name || next.name,
                    degree: updates.degree || next.degree,
                    university: updates.university || next.university,
                    passingYear: updates.passingYear || next.passingYear
                };
            }
            if (updates.title || updates.location || updates.engagement || updates.industries) {
                payload.careerPreferences = {
                    preferredRole: updates.title || next.title,
                    preferredLocation: updates.location || next.location,
                    engagement: updates.engagement || next.engagement,
                    industries: updates.industries || next.industries
                };
            }
            if (updates.certs) {
                payload.certificates = updates.certs.map(c => ({
                    name: c.name,
                    link: c.url,
                    fileName: '', // Meta
                    fileUrl: c.url // Placeholder
                }));
            }

            if (Object.keys(payload).length > 0) {
                await fetch(`${API_BASE_URL}/api/candidate/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
            }
        } catch (error) {
            console.error("Failed to sync profile change to backend:", error);
        }
    }, []);

    const toast = useCallback((msg: string) => {
        const id = ++toastId.current;
        setToasts(p => [...p, { id, msg }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    }, []);

    // Avatar upload
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        persist({ avatarUrl: URL.createObjectURL(f) });
        toast('Profile photo updated!');
    };

    // Resume upload
    const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return;
        persist({ resume: { name: f.name, date: 'Just now', url: URL.createObjectURL(f) } });
        toast('Resume uploaded!');
    };

    // Save profile
    const saveProfileEdit = () => {
        persist({ name: editForm.name, title: editForm.title, exp: editForm.exp, email: editForm.email, location: editForm.location, portfolio: editForm.portfolio });
        setShowEditProfile(false);
        toast('Profile saved!');
    };

    // Remove old manual addSkill and removeSkill logic since skills are now AI verified

    // Add cert
    const addCert = () => {
        if (!newCert.name.trim()) return;
        persist({ certs: [...stored.certs, { ...newCert, id: Date.now() }] });
        setNewCert({ name: '', issuer: '', year: '', icon: '🏆', color: '#3b82f6', url: '' });
        setShowAddCert(false);
        toast('Certification added!');
    };

    const removeCert = (id: number) => {
        persist({ certs: stored.certs.filter(c => c.id !== id) });
        toast('Certification removed.');
    };

    // Save bio
    const saveBio = () => {
        persist({ bio: bioEdit });
        setShowEditBio(false);
        toast('Bio updated!');
    };

    const handleShare = () => {
        navigator.clipboard?.writeText(window.location.href).catch(() => { });
        toast('Profile link copied!');
    };

    const handleLogout = () => {
        localStorage.removeItem('PROVAHIRE_USER');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        window.location.hash = '#home';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    };

    const totalViews = stored.views.candidates + stored.views.recruiters;

    return (
        <div className="pg-root">
            <div className="pg-blob pg-blob1" /><div className="pg-blob pg-blob2" /><div className="pg-blob pg-blob3" />

            <CandidateHeader activePage="profile" onNavigate={onNavigate} />

            {/* Preview Banner */}
            {previewMode && !isRecruiter && (
                <div className="pg-preview-banner">
                    <Eye size={15} /> Preview Mode — this is how recruiters see your profile
                    <button onClick={() => setPreviewMode(false)}><X size={14} /> Exit Preview</button>
                </div>
            )}

            <div className="pg-body">

                {/* ── Hero ───────────────────────────────────── */}
                <div className="pg-hero-card">
                    {/* Avatar */}
                    <div className="pg-avatar-wrap" onClick={() => !previewMode && avatarInputRef.current?.click()}
                        style={{ cursor: previewMode ? 'default' : 'pointer' }}>
                        <div className="pg-avatar-ring" />
                        <div className="pg-avatar">
                            {stored.avatarUrl
                                ? <img src={stored.avatarUrl} alt="avatar" className="pg-avatar-img" />
                                : <User size={40} className="pg-avatar-placeholder" />}
                        </div>
                        {!previewMode && <div className="pg-avatar-overlay"><Camera size={16} /></div>}
                        <span className="pg-status-dot" title="Available for Work" />
                        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </div>

                    {/* Info */}
                    <div className="pg-hero-info">
                        <div className="pg-hero-name-row">
                            <h1 className="pg-name">{stored.name || 'Your Name'}</h1>
                            <span className="pg-pro-badge"><Zap size={11} /> {(stored.subscriptionTier || 'FREE').toUpperCase()} MEMBER</span>
                        </div>
                        {(stored.skillScore !== null || stored.jobProfileMatch) && (
                            <div className="pg-hero-name-row" style={{ marginTop: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {stored.skillScore !== null && (
                                    <span className="pg-pro-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                                        <Award size={11} style={{ marginRight: '4px' }} /> ASTRAEVAL SCORE: {stored.skillScore}%
                                    </span>
                                )}
                                {stored.jobProfileMatch && (
                                    <span className="pg-pro-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                                        <Briefcase size={11} style={{ marginRight: '4px' }} /> MATCH: {stored.jobProfileMatch}
                                    </span>
                                )}
                            </div>
                        )}
                        <p className="pg-title-row">
                            <Briefcase size={14} className="pg-meta-icon" />
                            {stored.title || 'Your Title'}
                            {stored.exp && ` • ${stored.exp} years exp`}
                        </p>
                        <div className="pg-meta-row">
                            {stored.email && <span><Mail size={13} /> {stored.email}</span>}
                            {stored.location && <span><MapPin size={13} /> {stored.location}</span>}
                            {stored.portfolio && <span><Link size={13} /> {stored.portfolio}</span>}
                        </div>
                        {!previewMode && (
                            <div className="pg-hero-actions">
                                <button className="pg-btn-primary" onClick={() => { setEditForm({ name: stored.name, title: stored.title, exp: stored.exp, email: stored.email, location: stored.location, portfolio: stored.portfolio }); setShowEditProfile(true); }}>
                                    <Pencil size={14} /> Edit Profile
                                </button>
                                <button className="pg-btn-ghost" onClick={handleShare}><Share2 size={14} /> Share</button>
                                <button className="pg-btn-ghost" onClick={() => setPreviewMode(true)}><Eye size={14} /> Preview</button>
                                <button className="pg-btn-danger" onClick={handleLogout}><LogOut size={14} /> Logout</button>
                            </div>
                        )}
                        {previewMode && (
                            <div className="pg-hero-actions">
                                <button className="pg-btn-ghost" onClick={handleShare}><Share2 size={14} /> Share</button>
                            </div>
                        )}
                    </div>

                    {/* Completion ring */}
                    <Ring pct={completion} />
                </div>

                {/* ── View Counter ───────────────────────────── */}
                <div className="pg-views-card">
                    <div className="pg-view-stat">
                        <TrendingUp size={18} className="pg-view-icon" style={{ color: '#3b82f6' }} />
                        <div>
                            <p className="pg-view-num">{totalViews}</p>
                            <p className="pg-view-label">Total Profile Views</p>
                        </div>
                    </div>
                    <div className="pg-view-divider" />
                    <div className="pg-view-stat">
                        <User size={18} className="pg-view-icon" style={{ color: '#8b5cf6' }} />
                        <div>
                            <p className="pg-view-num">{stored.views.candidates}</p>
                            <p className="pg-view-label">Candidate Views</p>
                        </div>
                    </div>
                    <div className="pg-view-divider" />
                    <div className="pg-view-stat">
                        <Users size={18} className="pg-view-icon" style={{ color: '#10b981' }} />
                        <div>
                            <p className="pg-view-num">{stored.views.recruiters}</p>
                            <p className="pg-view-label">Recruiter Views</p>
                        </div>
                    </div>
                    {!previewMode && (
                        <p className="pg-view-note">Views update when others visit your profile</p>
                    )}
                </div>

                {/* ── Skills (AI Verified) ─────────────────────────────────── */}
                <div className="pg-section-card">
                    <div className="pg-section-header">
                        <div className="pg-section-title-row">
                            <div className="pg-section-icon"><Shield size={16} /></div>
                            <h2 className="pg-section-title">AI Verified Skills</h2>
                        </div>
                        {/* Removed manual add button */}
                    </div>
                    <div className="pg-skill-grid">
                        {stored.verifiedSkills && stored.verifiedSkills.length > 0
                            ? stored.verifiedSkills.map(s => <SkillBar key={s.id} skill={s} animated={animateBars} />)
                            : (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div className="pg-skill-ghost-grid">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="pg-skill-ghost-tile" />)}
                                    </div>
                                    <span className="pg-skill-ghost-cta" onClick={() => onNavigate('skill-zone')}>
                                        Take your first skill test to earn verified badges →
                                    </span>
                                </div>
                            )}
                    </div>
                </div>

                {/* ── Bottom Row ─────────────────────────────── */}
                <div className="pg-bottom-row">
                    {/* Certifications */}
                    <div className="pg-section-card pg-certs-card">
                        <div className="pg-section-header">
                            <div className="pg-section-title-row">
                                <div className="pg-section-icon"><Award size={16} /></div>
                                <h2 className="pg-section-title">Certifications</h2>
                            </div>
                            {!previewMode && <button className="pg-icon-btn" onClick={() => setShowAddCert(true)}><Plus size={16} /></button>}
                        </div>
                        <div className="pg-cert-grid">
                            {stored.certs.length > 0
                                ? stored.certs.map(c => (
                                    <div key={c.id} className="pg-cert-card">
                                        <div className="pg-cert-icon-wrap" style={{ background: `${c.color}20`, border: `1px solid ${c.color}40` }}>
                                            <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
                                        </div>
                                        <div className="pg-cert-info">
                                            <div className="pg-cert-name-row">
                                                <p className="pg-cert-name">{c.name}</p>
                                                {c.url && (
                                                    <a href={c.url} target="_blank" rel="noreferrer" className="pg-cert-link" title="View Certificate">
                                                        <ExternalLink size={13} />
                                                    </a>
                                                )}
                                            </div>
                                            <p className="pg-cert-meta">{c.issuer}{c.year ? ` • ${c.year}` : ''}</p>
                                            <div className="pg-verified-badge"><Shield size={11} /> VERIFIED</div>
                                        </div>
                                        {!previewMode && <button className="pg-icon-btn-sm" onClick={() => removeCert(c.id)}><Trash2 size={13} /></button>}
                                    </div>
                                ))
                                : <p className="pg-empty">{previewMode ? 'No certifications added.' : 'No certifications yet.'}</p>
                            }
                        </div>
                    </div>

                    {/* Resume */}
                    <div className="pg-section-card pg-resume-card">
                        <div className="pg-section-header">
                            <div className="pg-section-title-row">
                                <div className="pg-section-icon"><FileText size={16} /></div>
                                <h2 className="pg-section-title">Resume</h2>
                            </div>
                        </div>
                        {stored.resume
                            ? <div className="pg-resume-file">
                                <div className="pg-resume-icon-wrap"><FileText size={20} style={{ color: '#ef4444' }} /></div>
                                <div className="pg-resume-meta">
                                    <p className="pg-resume-name">{stored.resume.name}</p>
                                    <p className="pg-resume-date">Updated {stored.resume.date}</p>
                                </div>
                            </div>
                            : (
                                previewMode
                                    ? <p className="pg-empty">No resume uploaded.</p>
                                    : <div className="pg-upload-zone">
                                        <div className="pg-upload-zone-icon"><FileText size={20} style={{ color: '#ef4444' }} /></div>
                                        <p className="pg-upload-zone-text">No resume uploaded yet</p>
                                        <p className="pg-upload-zone-hint">PDF, DOC, or DOCX — max 10 MB</p>
                                    </div>
                            )}
                        <div className="pg-resume-actions">
                            {stored.resume && (
                                <a href={stored.resume.url} target="_blank" rel="noreferrer" className="pg-btn-ghost pg-btn-sm">
                                    <Eye size={14} /> View
                                </a>
                            )}
                            {!previewMode && (
                                <button className="pg-btn-primary pg-btn-sm" onClick={() => resumeInputRef.current?.click()}>
                                    <Upload size={14} /> Upload
                                </button>
                            )}
                            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} />
                        </div>
                    </div>
                </div>

                {/* ── Bio ─────────────────────────────────────── */}
                <div className="pg-section-card">
                    <div className="pg-section-header">
                        <div className="pg-section-title-row">
                            <div className="pg-section-icon"><Star size={16} /></div>
                            <h2 className="pg-section-title">About Me</h2>
                        </div>
                        {!previewMode && (
                            <button className="pg-icon-btn" onClick={() => { setBioEdit(stored.bio); setShowEditBio(true); }}><Pencil size={15} /></button>
                        )}
                    </div>
                    {stored.bio
                        ? <p className="pg-bio-text">{stored.bio}</p>
                        : <p className="pg-bio-empty">
                            {previewMode
                                ? 'No bio provided.'
                                : 'Add a professional bio to stand out to recruiters. Tell them about your skills, experience, and what makes you unique.'}
                        </p>
                    }
                    {stored.degree && (
                        <div className="pg-education-row">
                            <span className="pg-edu-label">🎓 Education</span>
                            <span className="pg-edu-val">{stored.degree}{stored.university ? `, ${stored.university}` : ''}{stored.passingYear ? ` (${stored.passingYear})` : ''}</span>
                        </div>
                    )}
                    {stored.industries && stored.industries.length > 0 && (
                        <div className="pg-industry-row">
                            {stored.industries.map(ind => <span key={ind} className="pg-industry-chip">{ind}</span>)}
                        </div>
                    )}
                </div>

            </div>

            {/* ─── MODALS ─── */}

            {showEditProfile && (
                <Modal onClose={() => setShowEditProfile(false)}>
                    <div className="pg-modal-header">
                        <h3 className="pg-modal-title">Edit Profile</h3>
                        <button className="pg-icon-btn" onClick={() => setShowEditProfile(false)}><X size={18} /></button>
                    </div>
                    <div className="pg-modal-body">
                        <div className="pg-form-grid">
                            {([
                                { label: 'Full Name', key: 'name', type: 'text' },
                                { label: 'Job Title', key: 'title', type: 'text' },
                                { label: 'Years of Experience', key: 'exp', type: 'number' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Location', key: 'location', type: 'text' },
                                { label: 'Portfolio URL', key: 'portfolio', type: 'text' },
                            ] as { label: string; key: keyof typeof editForm; type: string }[]).map(({ label, key, type }) => (
                                <div key={key} className="pg-form-group">
                                    <label className="pg-form-label">{label}</label>
                                    <input className="pg-form-input" type={type}
                                        value={editForm[key]}
                                        onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pg-modal-footer">
                        <button className="pg-btn-ghost" onClick={() => setShowEditProfile(false)}>Cancel</button>
                        <button className="pg-btn-primary" onClick={saveProfileEdit}><Check size={14} /> Save Changes</button>
                    </div>
                </Modal>
            )}

            {/* Manual Skill Modal Removed */}

            {showAddCert && (
                <Modal onClose={() => setShowAddCert(false)}>
                    <div className="pg-modal-header">
                        <h3 className="pg-modal-title">Add Certification</h3>
                        <button className="pg-icon-btn" onClick={() => setShowAddCert(false)}><X size={18} /></button>
                    </div>
                    <div className="pg-modal-body">
                        <div className="pg-form-group">
                            <label className="pg-form-label">Certificate Name</label>
                            <input className="pg-form-input" placeholder="e.g. AWS Solutions Architect" value={newCert.name}
                                onChange={e => setNewCert(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="pg-form-group">
                            <label className="pg-form-label">Issuer</label>
                            <input className="pg-form-input" placeholder="e.g. Amazon Web Services" value={newCert.issuer}
                                onChange={e => setNewCert(p => ({ ...p, issuer: e.target.value }))} />
                        </div>
                        <div className="pg-form-group">
                            <label className="pg-form-label">Year</label>
                            <input className="pg-form-input" placeholder="e.g. 2024" value={newCert.year}
                                onChange={e => setNewCert(p => ({ ...p, year: e.target.value }))} />
                        </div>
                        <div className="pg-form-group">
                            <label className="pg-form-label">Certificate URL (optional)</label>
                            <input className="pg-form-input" placeholder="https://credly.com/badges/..." value={newCert.url}
                                onChange={e => setNewCert(p => ({ ...p, url: e.target.value }))} />
                        </div>
                        <div className="pg-form-group">
                            <label className="pg-form-label">Icon</label>
                            <div className="pg-icon-grid">
                                {CERT_ICONS.map(ic => (
                                    <button key={ic} className={`pg-icon-pick ${newCert.icon === ic ? 'selected' : ''}`}
                                        onClick={() => setNewCert(p => ({ ...p, icon: ic }))}>{ic}</button>
                                ))}
                            </div>
                        </div>
                        <div className="pg-form-group">
                            <label className="pg-form-label">Color Theme</label>
                            <div className="pg-color-row">
                                {CERT_COLORS.map(c => (
                                    <button key={c} className={`pg-color-swatch ${newCert.color === c ? 'selected' : ''}`}
                                        style={{ background: c }} onClick={() => setNewCert(p => ({ ...p, color: c }))} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="pg-modal-footer">
                        <button className="pg-btn-ghost" onClick={() => setShowAddCert(false)}>Cancel</button>
                        <button className="pg-btn-primary" onClick={addCert} disabled={!newCert.name.trim()}><Plus size={14} /> Add</button>
                    </div>
                </Modal>
            )}

            {showEditBio && (
                <Modal onClose={() => setShowEditBio(false)}>
                    <div className="pg-modal-header">
                        <h3 className="pg-modal-title">Edit Bio</h3>
                        <button className="pg-icon-btn" onClick={() => setShowEditBio(false)}><X size={18} /></button>
                    </div>
                    <div className="pg-modal-body">
                        <div className="pg-form-group">
                            <label className="pg-form-label">About Me</label>
                            <textarea className="pg-form-textarea" rows={5} value={bioEdit}
                                onChange={e => setBioEdit(e.target.value)} placeholder="Tell recruiters about yourself..." />
                            <span className="pg-char-count">{bioEdit.length} chars</span>
                        </div>
                    </div>
                    <div className="pg-modal-footer">
                        <button className="pg-btn-ghost" onClick={() => setShowEditBio(false)}>Cancel</button>
                        <button className="pg-btn-primary" onClick={saveBio}><Check size={14} /> Save Bio</button>
                    </div>
                </Modal>
            )}

            <Toaster toasts={toasts} />
        </div>
    );
};

export default CandidateProfile;
