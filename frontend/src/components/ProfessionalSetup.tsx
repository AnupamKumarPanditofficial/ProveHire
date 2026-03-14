import { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Plus, Link, ArrowLeft, ArrowRight } from 'lucide-react';
import { getAuthUser } from '../utils/profileStore';
import { API_BASE_URL } from '../globalConfig';
import './ProfessionalSetup.css';

interface ProfessionalSetupProps {
    onBack: () => void;
    onFinish: () => void;
    progress: number;
}

interface UploadedFile {
    name: string;
    size: string;
    complete: boolean;
    file?: File;
}

const ProfessionalSetup = ({ onBack, onFinish, progress }: ProfessionalSetupProps) => {
    const [certName, setCertName] = useState('');
    const [certLink, setCertLink] = useState('');
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFile = (file: File) => {
        setUploadedFile({ name: file.name, size: formatSize(file.size), complete: true, file });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const canFinish = certName.trim() !== '' && agreed && !loading;

    const handleFinish = async () => {
        if (!canFinish) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token') || getAuthUser()?.token;
            if (!token) throw new Error("No token found");

            // Prepare certificate data
            const certificates = [{
                name: certName,
                link: certLink,
                fileName: uploadedFile?.name || '',
                fileUrl: uploadedFile?.file ? URL.createObjectURL(uploadedFile.file) : '', // In real prod, this would be an S3/Cloudinary URL
                uploadedAt: new Date()
            }];

            // Save to Database (best-effort — routing is localStorage-driven)
            const res = await fetch(`${API_BASE_URL}/api/candidate/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    certificates,
                    consentAgreed: agreed
                })
            });

            if (!res.ok) throw new Error("Failed to update profile");

            // Mark onboarding done on backend
            await fetch(`${API_BASE_URL}/api/auth/complete-onboarding`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            // Log but don't block — onboarding completion is stored locally,
            // API persistence is best-effort.
            console.error("Finish onboarding error (non-blocking):", error);
        } finally {
            setLoading(false);
            // Always call onFinish so ConfirmationPage can write onboardingDone: true
            // to localStorage and allow the route guard to pass.
            onFinish();
        }
    };

    return (
        <div className="ps-container">
            <div className="ob-header">
                <div className="ob-header-top">
                    <div className="ob-header-titles">
                        <span className="ob-main-title">Onboarding Status</span>
                        <span className="ob-sub-title">Final Step: Professional Setup</span>
                    </div>
                    <span className="ob-percent">{progress}%</span>
                </div>
                <div className="ob-bar-track">
                    <div className="ob-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="onboarding-card ps-card">
                <h2 className="ps-title">Professional Support</h2>
                <p className="ps-subtitle">Add your key certifications and agree to terms to complete your high-tier profile.</p>

                <div className="ps-form-section">
                    <div className="form-group">
                        <label>Main Certificate Name</label>
                        <div className="input-with-icon">
                            <Plus size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="e.g. AWS Solutions Architect"
                                value={certName}
                                onChange={e => setCertName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Certificate Link <span className="optional-tag">(Optional)</span></label>
                        <div className="input-with-icon">
                            <Link size={18} className="input-icon" />
                            <input
                                type="url"
                                placeholder="https://credly.com/..."
                                value={certLink}
                                onChange={e => setCertLink(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="ps-upload-section">
                    <label className="section-label">Certificate File <span className="optional-tag">(Optional)</span></label>
                    <div
                        className={`dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => !uploadedFile && fileInputRef.current?.click()}
                    >
                        {!uploadedFile ? (
                            <>
                                <UploadCloud size={32} className="dropzone-icon" />
                                <p className="dropzone-main">Drop file or Browse</p>
                                <p className="dropzone-sub">PDF preferred (Max 5MB)</p>
                            </>
                        ) : (
                            <div className="file-preview">
                                <FileText size={20} className="file-icon" />
                                <span className="file-preview-name">{uploadedFile.name}</span>
                                <button className="remove-file-btn" onClick={e => { e.stopPropagation(); setUploadedFile(null); }}>
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            style={{ display: 'none' }}
                            onChange={e => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
                        />
                    </div>
                </div>

                <div className="consent-section">
                    <label className="consent-label">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                        />
                        <span>I confirm that the details provided are accurate and I agree to PROVAHIRE's <a href="#/terms" className="consent-link">Terms of Service</a>.</span>
                    </label>
                </div>

                <div className="form-actions">
                    <button className="back-btn" onClick={onBack} disabled={loading}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button
                        className={`finish-btn ${!canFinish ? 'disabled' : ''}`}
                        onClick={handleFinish}
                        disabled={!canFinish}
                    >
                        {loading ? 'Processing...' : 'Finish Onboarding'} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalSetup;
