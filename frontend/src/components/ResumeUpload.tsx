import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { UploadCloud, FileText, X, Plus, Link, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { saveProfile } from '../utils/profileStore';
import './ResumeUpload.css';

interface ResumeUploadProps {
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

const ResumeUpload = ({ onBack, onFinish, progress }: ResumeUploadProps) => {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [certName, setCertName] = useState('');
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [agreed, setAgreed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFile = (file: File) => {
        setUploadedFile({ name: file.name, size: formatSize(file.size), complete: true, file });
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const canFinish = uploadedFile !== null && agreed;

    const handleFinish = () => {
        if (!canFinish || !uploadedFile?.file) return;
        const url = URL.createObjectURL(uploadedFile.file);
        saveProfile({
            resume: {
                name: uploadedFile.name,
                date: new Date().toISOString(),
                url: url
            }
        });
        onFinish();
    };

    return (
        <div className="resume-container">
            <div className="ob-header">
                <div className="ob-header-top">
                    <div className="ob-header-titles">
                        <span className="ob-main-title">Onboarding Status</span>
                        <span className="ob-sub-title">Final Step: Professional Documents</span>
                    </div>
                    <span className="ob-percent">{progress}%</span>
                </div>
                <div className="ob-bar-track">
                    <div className="ob-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                {progress === 100 && (
                    <div className="profile-verified-badge">
                        <CheckCircle2 size={14} /> All profile information verified
                    </div>
                )}
            </div>

            <div className="onboarding-card resume-card">
                <h2 className="resume-title">Complete Your Profile</h2>
                <p className="resume-subtitle">Upload your resume and any relevant certifications to match with premium high-tier roles.</p>

                <div className="resume-upload-section">
                    <label className="section-label">Resume Upload</label>
                    <div
                        className={`dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => !uploadedFile && fileInputRef.current?.click()}
                    >
                        {!uploadedFile ? (
                            <>
                                <UploadCloud size={40} className="dropzone-icon" />
                                <p className="dropzone-main">Drag and Drop your Resume</p>
                                <p className="dropzone-sub">Supported Formats: PDF, DOCX (Max 5MB)</p>
                                <button className="browse-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                    Browse Files
                                </button>
                            </>
                        ) : (
                            <div className="file-preview">
                                <FileText size={28} className="file-icon" />
                                <div className="file-details">
                                    <span className="file-name">{uploadedFile.name}</span>
                                    <div className="file-meta">
                                        <span className="file-size">{uploadedFile.size}</span>
                                        <span className="file-status-dot">·</span>
                                        <span className="file-ready">Ready for submission</span>
                                    </div>
                                    <div className="file-progress-bar">
                                        <div className="file-progress-fill"></div>
                                    </div>
                                </div>
                                <span className="complete-badge">COMPLETE</span>
                                <button className="remove-file-btn" onClick={e => { e.stopPropagation(); setUploadedFile(null); }}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            style={{ display: 'none' }}
                            onChange={e => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
                        />
                    </div>
                </div>

                <div className="optional-section">
                    <label className="section-label">Certifications & Portfolio <span className="optional-tag">(Optional)</span></label>
                    <div className="optional-row">
                        <div className="optional-item">
                            <Plus size={16} className="optional-item-icon" />
                            <input
                                type="text"
                                placeholder="Add AWS Certification"
                                value={certName}
                                onChange={e => setCertName(e.target.value)}
                            />
                        </div>
                        <div className="optional-item">
                            <Link size={16} className="optional-item-icon" />
                            <input
                                type="url"
                                placeholder="Link Portfolio URL"
                                value={portfolioUrl}
                                onChange={e => setPortfolioUrl(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="consent-section">
                    <label className="consent-label">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={e => setAgreed(e.target.checked)}
                        />
                        <span>I confirm that the documents provided are accurate and I agree to PROVAHIRE's <a href="#/terms" className="consent-link">Terms of Service</a> regarding professional data processing.</span>
                    </label>
                </div>

                <div className="form-actions">
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button
                        className={`finish-btn ${!canFinish ? 'disabled' : ''}`}
                        onClick={canFinish ? handleFinish : undefined}
                        disabled={!canFinish}
                    >
                        Finish Onboarding <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeUpload;
