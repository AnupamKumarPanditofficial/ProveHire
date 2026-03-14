import React, { useState, useCallback } from 'react';
import { ChevronRight, ArrowRight, CheckCircle } from 'lucide-react';
import TagInput from '../components/ui/TagInput';
import WeightSlider from '../components/ui/WeightSlider';
import { createJob } from '../services/recruiterApi';
import type { WorkspaceType } from './RecruiterDashboard';
import './PostNewJobPage.css';

interface Props { onNavigate: (ws: WorkspaceType) => void; }

interface Weights { skillScore: number; resumeScore: number; hireScore: number; }
interface Errors { title?: string; description?: string; location?: string; skills?: string; }

const WEIGHT_CONFIG = [
    { key: 'skillScore', label: 'Skill Score', desc: 'Relevance of technical stack and proficiency' },
    { key: 'resumeScore', label: 'Resume Score', desc: 'Professional history and format analysis' },
    { key: 'hireScore', label: 'Hire Score', desc: 'Sentiment analysis on previous roles' },
] as const;

const EXP_OPTIONS = ['Select range', '0-1 yr', '1-3 yrs', '3-5 yrs', '5-8 yrs', '8+ yrs'];
const DEPT_OPTIONS = ['Engineering', 'Design', 'Data Science', 'Marketing', 'Product', 'HR', 'Finance', 'Operations', 'Other'];
const EMP_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const PostNewJobPage: React.FC<Props> = ({ onNavigate }) => {
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('Engineering');
    const [location, setLocation] = useState('');
    const [empType, setEmpType] = useState('Full-time');
    const [lastDateToApply, setLastDateToApply] = useState('');
    const [experience, setExperience] = useState('');
    const [skills, setSkills] = useState<string[]>(['React', 'Node.js', 'TypeScript']);
    const [description, setDescription] = useState('');
    const [weights, setWeights] = useState<Weights>({ skillScore: 40, resumeScore: 30, hireScore: 30 });
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // Sliders are now independent (no auto-normalization per user request)
    const handleWeightChange = useCallback((key: keyof Weights, newVal: number) => {
        setWeights(prev => ({ ...prev, [key]: newVal }));
    }, []);

    const validate = (): boolean => {
        const e: Errors = {};
        if (!title.trim() || title.trim().length < 3) e.title = 'Job title must be at least 3 characters.';
        if (!location.trim()) e.location = 'Location is required.';
        if (!description.trim() || description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
        if (skills.length === 0) e.skills = 'Add at least one required skill.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSaveDraft = async () => {
        if (!title.trim()) {
            setErrors({ title: 'Title is required to save a draft.' });
            return;
        }
        setSubmitting(true);
        try {
            await createJob({ title, department, location, employmentType: empType, experienceRange: experience, description, skills, status: 'Draft', aiWeights: weights, lastDateToApply: lastDateToApply || null });
            showToast('Job saved as draft ✓');
            setTimeout(() => onNavigate('jobs-list'), 1500);
        } catch (err) {
            showToast('Failed to save draft');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            await createJob({ title, department, location, employmentType: empType, experienceRange: experience, description, skills, status: 'Active', aiWeights: weights, lastDateToApply: lastDateToApply || null });
            showToast('Job published successfully 🎉');
            setTimeout(() => onNavigate('jobs-list'), 1500);
        } catch (err) {
            showToast('Failed to publish job. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);

    return (
        <div className="post-job-page">
            {/* Topbar */}
            <div className="post-job-topbar">
                <button className="breadcrumb-link" onClick={() => onNavigate('jobs-list')}>Jobs</button>
                <ChevronRight size={13} />
                <span className="current">Post New Job</span>
            </div>

            {/* Scrollable content */}
            <div className="post-job-scroll">
                <div className="post-job-header">
                    <h1>Create New Job Listing</h1>
                    <p>Configure your job requirements and AI evaluation parameters.</p>
                </div>

                <div className="post-job-layout">
                    {/* ── Left: General Information ─────────────────────────────── */}
                    <div className="pj-card">
                        <div className="pj-card-header">
                            <div className="pj-card-icon">📄</div>
                            <h2>General Information</h2>
                        </div>

                        {/* Job Title */}
                        <div className="form-field">
                            <label className="form-label">Job Role / Title</label>
                            <input
                                className={`form-input${errors.title ? ' error' : ''}`}
                                value={title}
                                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
                                placeholder="e.g. Senior Full Stack Engineer"
                            />
                            {errors.title && <span className="form-error-text">{errors.title}</span>}
                        </div>

                        {/* Department */}
                        <div className="form-field">
                            <label className="form-label">Department</label>
                            <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
                                {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>

                        {/* Exp + Location row */}
                        <div className="field-row">
                            <div className="form-field">
                                <label className="form-label">Years of Experience</label>
                                <select className="form-select" value={experience} onChange={e => setExperience(e.target.value)}>
                                    {EXP_OPTIONS.map(o => <option key={o} value={o === 'Select range' ? '' : o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Location</label>
                                <input
                                    className={`form-input${errors.location ? ' error' : ''}`}
                                    value={location}
                                    onChange={e => { setLocation(e.target.value); setErrors(p => ({ ...p, location: undefined })); }}
                                    placeholder="Remote, New York, etc."
                                />
                                {errors.location && <span className="form-error-text">{errors.location}</span>}
                            </div>
                        </div>

                        {/* Employment Type + Last Date Row */}
                        <div className="field-row">
                            <div className="form-field">
                                <label className="form-label">Employment Type</label>
                                <select className="form-select" value={empType} onChange={e => setEmpType(e.target.value)}>
                                    {EMP_OPTIONS.map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label className="form-label">Last Date to Apply</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={lastDateToApply}
                                    onChange={e => setLastDateToApply(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Required Skills (TagInput) */}
                        <div className="form-field">
                            <label className="form-label">Required Skills</label>
                            <TagInput tags={skills} onChange={setSkills} error={!!errors.skills} />
                            {errors.skills && <span className="form-error-text">{errors.skills}</span>}
                        </div>

                        {/* Description */}
                        <div className="form-field">
                            <label className="form-label">Job Description</label>
                            <textarea
                                className={`form-textarea${errors.description ? ' error' : ''}`}
                                value={description}
                                onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: undefined })); }}
                                placeholder="Describe the responsibilities and requirements..."
                            />
                            {errors.description && <span className="form-error-text">{errors.description}</span>}
                        </div>
                    </div>

                    {/* ── Right: AI Evaluation Weighting ────────────────────────── */}
                    <div className="pj-card">
                        <div className="pj-card-header">
                            <div className="pj-card-icon">⚙️</div>
                            <h2>AI Evaluation Weighting</h2>
                        </div>
                        <p className="pj-card-subtitle">
                            Define the importance of each metric in the final candidate score (Total: 100%)
                        </p>

                        {WEIGHT_CONFIG.map(({ key, label, desc }) => (
                            <WeightSlider
                                key={key}
                                label={label}
                                value={weights[key]}
                                description={desc}
                                onChange={val => handleWeightChange(key, val)}
                            />
                        ))}

                        {/* Total indicator */}
                        {weightTotal !== 100 && (
                            <p style={{ fontSize: '0.75rem', color: '#f75f7c', marginTop: '-0.75rem', marginBottom: '1rem' }}>
                                ⚠ Weights sum to {weightTotal}% (Sum must be 100% for balanced evaluation)
                            </p>
                        )}

                        {/* Auto-optimization info box */}
                        <div className="ai-auto-box">
                            <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>Auto-optimization is active. AI will adjust weights based on initial candidate quality.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed action bar */}
            <div className="post-job-actions">
                <button className="btn-ghost" onClick={handleSaveDraft} disabled={submitting}>
                    Save as Draft
                </button>
                <button className="btn-ghost" onClick={() => setShowPreview(true)}>
                    Preview Listing
                </button>
                <button className="btn-publish" onClick={handlePublish} disabled={submitting}>
                    {submitting ? 'Publishing...' : 'Publish Job Listing'} <ArrowRight size={16} />
                </button>
            </div>

            {/* Toast */}
            {toast && <div className="toast-success">{toast}</div>}

            {/* Preview Modal */}
            {showPreview && (
                <div className="preview-overlay" onClick={() => setShowPreview(false)}>
                    <div className="preview-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h2>{title || '(No title)'}</h2>
                            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                                onClick={() => setShowPreview(false)}>×</button>
                        </div>
                        <div className="detail-row">
                            {[['Department', department], ['Location', location || '—'], ['Type', empType], ['Experience', experience || '—'], ['Deadline', lastDateToApply || 'No deadline']].map(([k, v]) => (
                                <div key={k}>
                                    <div className="detail-label">{k}</div>
                                    <div className="detail-value">{v}</div>
                                </div>
                            ))}
                        </div>
                        <div className="detail-label" style={{ marginBottom: '0.5rem' }}>Required Skills</div>
                        <div className="skill-tags">
                            {skills.length > 0 ? skills.map(s => <span key={s} className="skill-tag">{s}</span>) : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>None</span>}
                        </div>
                        <div className="detail-label" style={{ marginBottom: '0.4rem' }}>Description</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {description || '(No description)'}
                        </p>
                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <div className="detail-label" style={{ marginBottom: '0.75rem' }}>AI Evaluation Weights</div>
                            {WEIGHT_CONFIG.map(({ key, label }) => (
                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                    <span>{label}</span><strong style={{ color: '#4f8ef7' }}>{weights[key]}%</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostNewJobPage;
