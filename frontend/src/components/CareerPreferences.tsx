import { useState } from 'react';
import { API_BASE_URL } from '../globalConfig';
import { Briefcase, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { saveProfile, getAuthUser } from '../utils/profileStore';
import './CareerPreferences.css';

interface CareerPreferencesProps {
    onBack: () => void;
    onNext: () => void;
    progress: number;
}

const INDUSTRIES = ['Fintech', 'SaaS', 'AI/ML', 'E-commerce', 'Healthcare', 'EdTech', 'Cybersecurity'];
const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UI/UX Designer'];

const CareerPreferences = ({ onBack, onNext, progress }: CareerPreferencesProps) => {
    const [engagement, setEngagement] = useState<'job' | 'internship'>('job');
    const [preferredRole, setPreferredRole] = useState('');
    const [preferredLocation, setPreferredLocation] = useState('');
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleIndustry = (industry: string) => {
        setSelectedIndustries(prev =>
            prev.includes(industry) ? prev.filter(i => i !== industry) : [...prev, industry]
        );
    };

    const canProceed = preferredRole !== '' && preferredLocation.trim() !== '';

    return (
        <div className="cp-container">
            <div className="ob-header">
                <div className="ob-header-top">
                    <div className="ob-header-titles">
                        <span className="ob-main-title">Onboarding Progress</span>
                        <span className="ob-sub-title">Step 3 of 5: Personalising your feed</span>
                    </div>
                    <span className="ob-percent">{progress}%</span>
                </div>
                <div className="ob-bar-track">
                    <div className="ob-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="onboarding-card cp-card">
                <h2 className="cp-title">Career Preferences</h2>
                <p className="cp-subtitle">Tell us what you're looking for to help us find the best matches.</p>

                <div className="cp-inner-progress">
                    <div className="cp-inner-progress-header">
                        <span className="cp-inner-progress-label">Onboarding Progress</span>
                        <span className="cp-inner-progress-sub">Step 3 of 5: Personalising your feed</span>
                        <span className="cp-inner-progress-pct">{progress}%</span>
                    </div>
                    <div className="cp-inner-bar-track">
                        <div className="cp-inner-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="engagement-section">
                    <p className="section-label">What is your preferred engagement?</p>
                    <div className="engagement-toggle">
                        <button
                            className={`toggle-btn ${engagement === 'job' ? 'active' : ''}`}
                            onClick={() => setEngagement('job')}
                        >
                            Job
                        </button>
                        <button
                            className={`toggle-btn ${engagement === 'internship' ? 'active' : ''}`}
                            onClick={() => setEngagement('internship')}
                        >
                            Internship
                        </button>
                    </div>
                </div>

                <div className="cp-row">
                    <div className="form-group">
                        <label>Preferred Role</label>
                        <div className="input-with-icon">
                            <Briefcase size={17} className="input-icon" />
                            <select
                                value={preferredRole}
                                onChange={e => setPreferredRole(e.target.value)}
                                className={preferredRole === '' ? 'placeholder-active' : ''}
                            >
                                <option value="">Select a role...</option>
                                {ROLES.map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Preferred Location</label>
                        <div className="input-with-icon">
                            <MapPin size={17} className="input-icon" />
                            <input
                                type="text"
                                placeholder="e.g. San Francisco, CA or Remote"
                                value={preferredLocation}
                                onChange={e => setPreferredLocation(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="industries-section">
                    <p className="section-label">Industry Interests <span className="optional-tag">(Optional)</span></p>
                    <div className="industry-chips">
                        {INDUSTRIES.map(ind => (
                            <button
                                key={ind}
                                className={`industry-chip ${selectedIndustries.includes(ind) ? 'selected' : ''}`}
                                onClick={() => toggleIndustry(ind)}
                            >
                                {ind}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button
                        className={`next-step-btn ${!canProceed || loading ? 'disabled' : ''}`}
                        onClick={async () => {
                            if (!canProceed || loading) return;
                            setLoading(true);
                            try {
                                const token = localStorage.getItem('auth_token') || getAuthUser()?.token;
                                // Save to Database
                                const res = await fetch(`${API_BASE_URL}/api/candidate/career-preferences`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        careerPreferences: {
                                            engagement,
                                            preferredRole,
                                            preferredLocation,
                                            industries: selectedIndustries,
                                        }
                                    })
                                });
                                if (!res.ok) throw new Error("Failed to save career preferences");

                                saveProfile({
                                    title: preferredRole,
                                    location: preferredLocation,
                                    engagement,
                                    industries: selectedIndustries,
                                });
                                onNext();
                            } catch (error) {
                                console.error(error);
                                alert("Failed to save career preferences.");
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={!canProceed || loading}
                    >
                        {loading ? 'Saving...' : 'Next Step'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CareerPreferences;
