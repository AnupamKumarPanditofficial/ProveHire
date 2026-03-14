import React, { useState, useEffect } from 'react';
import {
    User, Building2, Mail, Phone, Globe, MapPin, Briefcase,
    Linkedin, Save, Edit2, X, CheckCircle2, AlertCircle, Camera
} from 'lucide-react';
import useFetch from '../../hooks/useFetch';
import { getProfile, updateProfile, type RecruiterProfile } from '../../services/recruiterApi';
import './DashboardHome.css'; // Reusing some shared styles

const ProfileWorkspace: React.FC = () => {
    const { data: initialProfile, loading, error, refetch } = useFetch<RecruiterProfile>(getProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<RecruiterProfile>>({});
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (initialProfile) {
            setFormData(initialProfile);
        }
    }, [initialProfile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile(formData);
            setSuccessMessage('Profile updated successfully!');
            setIsEditing(false);
            refetch();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error('Save profile error:', err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader" /></div>;
    if (error) return <div className="error-msg">Error: {error}</div>;

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="profile-section-header">
            <Icon size={18} />
            <h3>{title}</h3>
        </div>
    );

    return (
        <div className="profile-workspace slide-in">
            <div className="dashboard-header profile-header-nav">
                <div className="dashboard-header-left">
                    <h1>Recruiter Profile</h1>
                    <p>Manage your personal and company information</p>
                </div>
                {!isEditing ? (
                    <button className="btn-post-job" onClick={() => setIsEditing(true)}>
                        <Edit2 size={14} /> Edit Profile
                    </button>
                ) : (
                    <div className="profile-edit-actions">
                        <button className="btn-filter" onClick={() => { setIsEditing(false); setFormData(initialProfile || {}); }}>
                            <X size={14} /> Cancel
                        </button>
                        <button className="btn-post-job" onClick={handleSave} disabled={saving}>
                            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {successMessage && (
                <div className="success-toast">
                    <CheckCircle2 size={16} /> {successMessage}
                </div>
            )}

            <div className="profile-content-grid">
                {/* Personal Info Card */}
                <div className="profile-card main-info">
                    <div className="profile-card-header">
                        <div className="profile-avatar-large">
                            {formData.profilePic ? (
                                <img src={formData.profilePic} alt="" />
                            ) : (
                                <User size={40} />
                            )}
                            {isEditing && (
                                <div className="avatar-overlay">
                                    <Camera size={20} />
                                </div>
                            )}
                        </div>
                        <div className="profile-title-block">
                            {isEditing ? (
                                <input
                                    name="fullName"
                                    className="profile-input-large"
                                    value={formData.fullName || ''}
                                    onChange={handleChange}
                                />
                            ) : (
                                <h2>{formData.fullName}</h2>
                            )}
                            {isEditing ? (
                                <input
                                    name="designation"
                                    className="profile-input-sub"
                                    value={formData.designation || ''}
                                    onChange={handleChange}
                                    placeholder="Your Designation"
                                />
                            ) : (
                                <p className="designation">{formData.designation || 'Not specified'}</p>
                            )}
                        </div>
                    </div>

                    <div className="profile-details-list">
                        <div className="detail-item">
                            <Mail size={16} />
                            <div className="detail-content">
                                <label>Work Email</label>
                                {isEditing ? (
                                    <input name="workEmail" value={formData.workEmail || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.workEmail || formData.email}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <Phone size={16} />
                            <div className="detail-content">
                                <label>Phone Number</label>
                                {isEditing ? (
                                    <input name="phone" value={formData.phone || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.phone || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <Linkedin size={16} />
                            <div className="detail-content">
                                <label>LinkedIn URL</label>
                                {isEditing ? (
                                    <input name="linkedIn" value={formData.linkedIn || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.linkedIn || '—'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company Info Card */}
                <div className="profile-card secondary-info">
                    <SectionHeader icon={Building2} title="Company Information" />
                    <div className="profile-details-grid">
                        <div className="detail-item">
                            <Building2 size={16} />
                            <div className="detail-content">
                                <label>Company Name</label>
                                {isEditing ? (
                                    <input name="company" value={formData.company || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.company || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <Globe size={16} />
                            <div className="detail-content">
                                <label>Website</label>
                                {isEditing ? (
                                    <input name="companyWebsite" value={formData.companyWebsite || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.companyWebsite || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <Mail size={16} />
                            <div className="detail-content">
                                <label>Company Email</label>
                                {isEditing ? (
                                    <input name="companyEmail" value={formData.companyEmail || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.companyEmail || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <Building2 size={16} />
                            <div className="detail-content">
                                <label>Company Size</label>
                                {isEditing ? (
                                    <input name="companySize" value={formData.companySize || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.companySize || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <MapPin size={16} />
                            <div className="detail-content">
                                <label>Location</label>
                                {isEditing ? (
                                    <input name="companyLocation" value={formData.companyLocation || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.companyLocation || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <Briefcase size={16} />
                            <div className="detail-content">
                                <label>Industry</label>
                                {isEditing ? (
                                    <input name="industryType" value={formData.industryType || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.industryType || '—'}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recruiting Preferences */}
                <div className="profile-card secondary-info">
                    <SectionHeader icon={AlertCircle} title="Hiring Preferences" />
                    <div className="profile-details-grid">
                        <div className="detail-item">
                            <div className="detail-content">
                                <label>Experience Level</label>
                                {isEditing ? (
                                    <input name="experienceLevel" value={formData.experienceLevel || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.experienceLevel || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-content">
                                <label>Monthly Volume</label>
                                {isEditing ? (
                                    <input name="monthlyVolume" value={formData.monthlyVolume || ''} onChange={handleChange} />
                                ) : (
                                    <span>{formData.monthlyVolume || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-content">
                                <label>Job Type</label>
                                {isEditing ? (
                                    <input name="jobType" value={Array.isArray(formData.jobType) ? formData.jobType.join(', ') : formData.jobType || ''} onChange={handleChange} placeholder="e.g. Full Time, Contract" />
                                ) : (
                                    <span>{Array.isArray(formData.jobType) ? formData.jobType.join(', ') : formData.jobType || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-content">
                                <label>Work Mode</label>
                                {isEditing ? (
                                    <input name="workMode" value={Array.isArray(formData.workMode) ? formData.workMode.join(', ') : formData.workMode || ''} onChange={handleChange} placeholder="e.g. Remote, Hybrid" />
                                ) : (
                                    <span>{Array.isArray(formData.workMode) ? formData.workMode.join(', ') : formData.workMode || '—'}</span>
                                )}
                            </div>
                        </div>
                        <div className="detail-item full-width">
                            <div className="detail-content">
                                <label>Hiring Roles</label>
                                <div className="roles-tags">
                                    {Array.isArray(formData.hiringRoles) && formData.hiringRoles.length > 0 ? (
                                        formData.hiringRoles.map((role, idx) => (
                                            <span key={idx} className="role-tag">{role}</span>
                                        ))
                                    ) : (
                                        <span>{formData.hiringRoles || 'Not specified'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .profile-workspace { padding: 2rem; }
                .profile-content-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 1.5rem; 
                    margin-top: 1.5rem; 
                }
                .profile-card {
                    background: var(--card-bg, #1e222d);
                    border: 1px solid var(--border-color, #2a2d35);
                    border-radius: 12px;
                    padding: 1.5rem;
                }
                .profile-card.main-info { grid-column: 1 / -1; display: flex; gap: 2rem; align-items: flex-start; }
                .profile-card-header { display: flex; gap: 1.5rem; flex: 1; }
                .profile-avatar-large {
                    width: 80px; height: 80px;
                    background: var(--bg-secondary, #2a2d35);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: var(--primary-color, #4f8ef7);
                    overflow: hidden; position: relative;
                }
                .profile-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
                .profile-title-block h2 { margin: 0; font-size: 1.5rem; color: #fff; }
                .profile-title-block .designation { color: #9ca3af; margin-top: 0.25rem; font-size: 0.95rem; }
                .profile-details-list { display: flex; flex-direction: column; gap: 1rem; min-width: 300px; }
                .detail-item { display: flex; gap: 0.75rem; align-items: flex-start; color: #9ca3af; }
                .detail-content { display: flex; flex-direction: column; }
                .detail-content label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.15rem; }
                .detail-content span { color: #fff; font-size: 0.95rem; }
                .profile-section-header { display: flex; gap: 0.75rem; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #2a2d35; padding-bottom: 0.75rem; }
                .profile-section-header h3 { font-size: 1.1rem; color: #fff; margin: 0; }
                .profile-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
                .detail-item.full-width { grid-column: 1 / -1; }
                .roles-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
                .role-tag { background: rgba(79,142,247,0.1); color: #4f8ef7; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; }
                .profile-input-large { background: #16181d; border: 1px solid #4f8ef7; color: #fff; border-radius: 6px; padding: 0.25rem 0.5rem; font-size: 1.4rem; font-weight: 600; width: 100%; }
                .profile-input-sub { background: #16181d; border: 1px solid #3b4252; color: #9ca3af; border-radius: 4px; padding: 0.2rem 0.4rem; margin-top: 0.5rem; width: 100%; }
                .detail-content input { background: #16181d; border: 1px solid #3b4252; color: #fff; border-radius: 4px; padding: 0.3rem 0.6rem; font-size: 0.9rem; margin-top: 0.25rem; }
                .profile-edit-actions { display: flex; gap: 0.75rem; }
                .success-toast { background: rgba(34,184,102,0.15); color: #22b866; padding: 0.75rem 1.25rem; border-radius: 8px; border: 1px solid rgba(34,184,102,0.2); position: fixed; top: 100px; right: 2rem; display: flex; align-items: center; gap: 0.5rem; animation: slideInRight 0.3s ease; z-index: 1000; }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ProfileWorkspace;
