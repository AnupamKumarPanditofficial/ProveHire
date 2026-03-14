import { useState } from 'react';
import { API_BASE_URL } from '../globalConfig';
import { User, GraduationCap, Building2, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { saveProfile, getAuthUser } from '../utils/profileStore';
import './EducationDetails.css';

interface EducationDetailsProps {
    onBack: () => void;
    onNext: () => void;
    progress: number;
}

const EducationDetails = ({ onBack, onNext, progress }: EducationDetailsProps) => {
    const [formData, setFormData] = useState({
        fullName: '',
        degree: '',
        university: '',
        passingYear: ''
    });
    const [loading, setLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 20 }, (_, i) => currentYear - i + 5);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const filledCount = Object.values(formData).filter(v => v !== '').length;
    const dynamicProgress = Math.round((filledCount / 4) * progress);
    const canProceed = filledCount === 4;

    const handleNext = async () => {
        if (!canProceed || loading) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token') || getAuthUser()?.token;
            // Save to Database
            const res = await fetch(`${API_BASE_URL}/api/candidate/education`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    degree: formData.degree,
                    university: formData.university,
                    passingYear: formData.passingYear,
                })
            });

            if (!res.ok) throw new Error("Failed to save education details");

            // Also update local store for immediate UI consistency
            saveProfile({
                name: formData.fullName,
                degree: formData.degree,
                university: formData.university,
                passingYear: formData.passingYear,
            });
            onNext();
        } catch (error) {
            console.error(error);
            alert("Failed to save. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="education-details-container">
            <div className="onboarding-progress-header">
                <div className="progress-info-row">
                    <div className="progress-titles">
                        <span className="progress-main-title">Onboarding Progress</span>
                        <span className="progress-sub-title">Step 2: Education Details</span>
                    </div>
                    <span className="progress-percent">{dynamicProgress}%</span>
                </div>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill-dynamic" style={{ width: `${dynamicProgress}%` }}></div>
                </div>
            </div>

            <div className="onboarding-card education-card">
                <div className="form-header">
                    <h2>Tell us about your education</h2>
                    <p>Add your academic background to help recruiters know you better</p>
                </div>

                <form className="education-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-with-icon">
                            <User size={18} className="input-icon" />
                            <input type="text" name="fullName" placeholder="Enter your legal full name"
                                value={formData.fullName} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Degree</label>
                        <div className="input-with-icon">
                            <GraduationCap size={18} className="input-icon" />
                            <input type="text" name="degree" placeholder="e.g. Bachelor of Science in Computer Science"
                                value={formData.degree} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>College/University Name</label>
                        <div className="input-with-icon">
                            <Building2 size={18} className="input-icon" />
                            <input type="text" name="university" placeholder="e.g. Stanford University"
                                value={formData.university} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Passing Year</label>
                        <div className="input-with-icon select-wrapper">
                            <Calendar size={18} className="input-icon" />
                            <select name="passingYear" value={formData.passingYear} onChange={handleChange}
                                className={formData.passingYear === '' ? 'placeholder-active' : ''}>
                                <option value="" disabled>Select Year</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="back-btn" onClick={onBack}>
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button
                            type="button"
                            className={`next-step-btn ${!canProceed || loading ? 'disabled' : ''}`}
                            onClick={handleNext}
                            disabled={!canProceed || loading}
                        >
                            {loading ? 'Saving...' : 'Next Step'} <ArrowRight size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EducationDetails;
