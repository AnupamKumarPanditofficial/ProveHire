import { useState, useRef } from 'react';
import { FileUp, ShieldCheck, ArrowRight, BrainCircuit, AlertCircle } from 'lucide-react';
import CandidateHeader from '../../../components/CandidateHeader';
import { ParticleCanvas } from './ParticleCanvas';
import { evaluateResume, type ResumeScore } from '../../../services/geminiAssessment';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { hasFeature } from '../../../utils/planUtils';
import { getProfile } from '../../../utils/profileStore';
import { API_BASE_URL } from '../../../globalConfig';

// Configure PDF.js worker (needed for browser execution)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props { onNavigate: (p: string) => void; }

const ResumeUpload = ({ onNavigate }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [score, setScore] = useState<ResumeScore | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Guard route: ensure they selected career and experience
    const savedCareerId = sessionStorage.getItem('sz_career');
    const savedExpId = sessionStorage.getItem('sz_experience');

    if (!savedCareerId || !savedExpId) {
        onNavigate('skill-zone');
        return null;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setScore(null);
            setErrorMsg(null);
        }
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => (item as any).str);
            text += strings.join(' ') + '\n';
        }
        return text;
    };

    const extractTextFromDocx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const handleAnalyze = async () => {
        if (!file) return;

        const profile = getProfile();
        if (!hasFeature(profile, 'aiResume')) {
            setErrorMsg("AI Resume Analysis is a Premium feature. Please upgrade your plan to continue.");
            return;
        }

        setAnalyzing(true);
        setErrorMsg(null);

        try {
            let resumeText = '';
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                resumeText = await extractTextFromPDF(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                resumeText = await extractTextFromDocx(file);
            } else {
                // Try reading as plain text just in case (e.g. .txt files)
                resumeText = await file.text();
            }

            if (!resumeText.trim()) {
                throw new Error("Could not extract readable text from this file.");
            }

            // In larger apps we might enforce character limits to save tokens
            const MAX_CHARS = 12000;
            if (resumeText.length > MAX_CHARS) {
                resumeText = resumeText.substring(0, MAX_CHARS);
            }

            const careerMap: Record<string, string> = {
                'frontend': 'Frontend Engineer',
                'backend': 'Backend Engineer',
                'fullstack': 'Full Stack Developer',
                'data': 'Data Scientist'
            };
            const roleStr = careerMap[savedCareerId!] || savedCareerId!;

            const expMap: Record<string, string> = {
                'fresher': 'Fresher',
                '0-2': '1-2 years',
                '2-5': '2-5 years',
                '5+': '5+ years'
            };
            const expStr = expMap[savedExpId!] || savedExpId!;

            const result = await evaluateResume(resumeText, roleStr, expStr);
            setScore(result);
            sessionStorage.setItem('sz_resume_score', JSON.stringify(result));
        } catch (err: any) {
            console.error("Resume Analysis Error:", err);
            setErrorMsg(err.message || 'Failed to analyze resume. Please try a different file.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleContinue = async () => {
        if (!score) return;

        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Save to backend
                await fetch(`${API_BASE_URL}/api/candidate/profile/setup-role`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        targetRole: savedCareerId,
                        resumeScore: score.total
                    })
                });
            }
        } catch (e) {
            console.error("Failed to save initial setup:", e);
        }

        // Send straight to the Dashboard (which will be the new Skill Zone Hub)
        onNavigate('dashboard');
    };

    return (
        <div className="sz-root">
            <ParticleCanvas />
            <div className="sz-glow sz-glow1" />
            <div className="sz-glow sz-glow2" />

            <CandidateHeader activePage="skill-zone" onNavigate={onNavigate} />

            <div className="sz-content">
                {/* Status Indicator */}
                <div className="sz-steps-indicator">
                    {/* Updated progress bar logic for the 5 pre-exam steps */}
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className="sz-step-item" style={{ flex: '1 1 0' }}>
                            <div className={`sz-step-dot ${3 >= s ? 'active' : ''} ${3 > s ? 'done' : ''}`}>
                                {3 > s ? '✓' : s}
                            </div>
                            <span className={`sz-step-label ${3 === s ? 'active' : ''}`} style={{ fontSize: '0.7rem' }}>
                                {s === 1 ? 'Career' : s === 2 ? 'Experience' : s === 3 ? 'Resume' : s === 4 ? 'Rules' : 'Setup'}
                            </span>
                            {s < 5 && <div className={`sz-step-line ${3 > s ? 'done' : ''}`} />}
                        </div>
                    ))}
                </div>

                <div className="sz-step-panel sz-step-resume" style={{ maxWidth: 700 }}>
                    <button className="sz-back-btn" onClick={() => onNavigate('skill-zone/experience')}>← Back</button>

                    <div className="sz-hero-badge"><BrainCircuit size={13} /> Strict ATS Evaluation</div>
                    <h1 className="sz-title">Upload <span className="sz-accent">Resume</span></h1>
                    <p className="sz-subtitle" style={{ marginBottom: '2rem' }}>We verify your authenticity and skill depth before the assessment.</p>

                    {errorMsg && (
                        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: '-3px' }} />
                            {errorMsg}
                        </div>
                    )}

                    {!score && !analyzing && (
                        <div
                            style={{
                                border: '2px dashed rgba(255,255,255,0.2)',
                                padding: '3rem',
                                borderRadius: '16px',
                                textAlign: 'center',
                                background: 'rgba(20,27,43,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    setFile(e.dataTransfer.files[0]);
                                    setScore(null);
                                    setErrorMsg(null);
                                }
                            }}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="application/pdf,.docx,text/plain"
                                onChange={handleFileChange}
                            />
                            <FileUp size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                                {file ? file.name : "Click or drag resume here"}
                            </h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Supported formats: PDF, DOCX (Max 5MB)
                            </p>
                        </div>
                    )}

                    {analyzing && (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(20,27,43,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="sz-spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 1.5rem', borderColor: 'rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8' }} />
                            <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>AI is analyzing your profile</h3>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Checking role alignment, project authenticity, and GitHub links...</p>
                        </div>
                    )}

                    {score && (
                        <div style={{ background: 'rgba(20,27,43,0.8)', padding: '2rem', borderRadius: '16px', border: `1px solid ${score.total >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {score.total >= 70 ? <ShieldCheck color="#10b981" /> : <AlertCircle color="#ef4444" />}
                                        ATS Integrity Score
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>Based on strict AI evaluation</p>
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: score.total >= 70 ? '#10b981' : '#ef4444' }}>
                                    {score.total}%
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Role Alignment</span>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{score.breakdown.roleAlignment}/15</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Skill Depth</span>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{score.breakdown.skillDepth}/15</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Project Authenticity</span>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{score.breakdown.projectAuthenticity}/20</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>GitHub Verification</span>
                                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{score.breakdown.githubVerification}/15</span>
                                </div>
                            </div>

                            {score.total < 70 && (
                                <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    Your resume integrity score is below the required 70% threshold. You cannot proceed to the assessment.
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        {!score && file && !analyzing && (
                            <button
                                className="sz-btn-primary"
                                onClick={handleAnalyze}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Analyze Resume First
                            </button>
                        )}

                        {score && score.total >= 70 && (
                            <button
                                className="sz-btn-primary"
                                onClick={handleContinue}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Continue to Rules <ArrowRight size={16} />
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ResumeUpload;
