import React, { useState, useRef } from 'react';
import { FileUp, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { evaluateResume, type ResumeScore } from '../../../services/geminiAssessment';
import { getProfile, saveProfile } from '../../../utils/profileStore';

// Initialize PDF.js worker
const workerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface Props {
    targetRole: string;
    onClose: () => void;
    onComplete: (hireScore: number) => void;
}

const ResumeUploadModal: React.FC<Props> = ({ targetRole, onClose, onComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length) handleFileSelection(files[0]);
    };

    const handleFileSelection = (selectedFile: File) => {
        setErrorMsg('');
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(selectedFile.type)) {
            setErrorMsg('Please upload a PDF or DOCX file.');
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setErrorMsg('File size must be under 5MB.');
            return;
        }
        setFile(selectedFile);
    };

    const extractTextFromFile = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = e.target?.result;
                    if (!result) throw new Error("Could not read file.");

                    if (file.type === 'application/pdf') {
                        const typedarray = new Uint8Array(result as ArrayBuffer);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        let text = '';
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const content = await page.getTextContent();
                            const strings = content.items.map((item: any) => item.str);
                            text += strings.join(' ') + '\n';
                        }
                        resolve(text);
                    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        const arrayBuffer = result as ArrayBuffer;
                        const mammothResult = await mammoth.extractRawText({ arrayBuffer });
                        resolve(mammothResult.value);
                    }
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error("File read error"));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        setErrorMsg('');

        try {
            const text = await extractTextFromFile(file);
            if (text.length < 50) {
                throw new Error("Could not extract enough text from the document. Please ensure it is a text-based PDF/DOCX.");
            }

            // Hit the AI to evaluate resume against the target role
            const currentProfile = getProfile();
            const experience = currentProfile.exp || 'Mid Level';
            
            const resumeScoreObj: ResumeScore = await evaluateResume(text, targetRole, experience || '');
            const resumeScoreValue = resumeScoreObj.total;
            
            // Recalculate Master Hire Score
            const r = resumeScoreValue;
            const s = currentProfile.skillScore ?? 0;
            const t = currentProfile.testScore ?? 0;
            
            // Formula: Average of the three if they exist. 
            // Our logic explicitly expects them all to exist now since they've done skills and tests.
            const hireScore = Math.round((r + s + t) / 3);

            // Persist the results
            saveProfile({
                resumeScore: r,
                hireScore: hireScore
            });

            // Clean up session storage flag
            sessionStorage.removeItem('sz_resume_score'); // we save it to profile now directly.

            // Notify parent
            onComplete(hireScore);

        } catch (err: any) {
            console.error("Resume analysis error:", err);
            setErrorMsg(err.message || 'Failed to analyze resume. Please try another file.');
            setAnalyzing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 8, 20, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px', width: '90%', maxWidth: '500px', padding: '2rem',
                position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button 
                    onClick={onClose} 
                    disabled={analyzing}
                    style={{
                        position: 'absolute', top: '1.5rem', right: '1.5rem',
                        background: 'transparent', border: 'none', color: '#64748b',
                        cursor: analyzing ? 'not-allowed' : 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                    Final Step: Portfolio Verification
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    To generate your Master Hire Score for <strong>{targetRole}</strong>, we need to analyze your resume alongside your test performances.
                </p>

                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${isDragging ? '#3b82f6' : 'rgba(255,255,255,0.15)'}`,
                        background: isDragging ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)',
                        borderRadius: '16px', padding: '2.5rem 1.5rem', textAlign: 'center',
                        cursor: analyzing ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', marginBottom: '1.5rem'
                    }}
                >
                    <input 
                        type="file" 
                        accept=".pdf,.docx" 
                        ref={fileInputRef} 
                        onChange={(e) => e.target.files?.length && handleFileSelection(e.target.files[0])}
                        style={{ display: 'none' }}
                        disabled={analyzing}
                    />
                    
                    {!file ? (
                        <>
                            <FileUp size={40} color={isDragging ? '#3b82f6' : '#64748b'} style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Upload your Resume / CV</h3>
                            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>PDF or DOCX up to 5MB</p>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{file.name}</h3>
                            <p style={{ color: '#10b981', fontSize: '0.85rem' }}>Ready for analysis</p>
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px', padding: '0.75rem', color: '#ef4444', fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem'
                    }}>
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                )}

                <button
                    onClick={handleAnalyze}
                    disabled={!file || analyzing}
                    style={{
                        width: '100%', padding: '1rem', background: (!file || analyzing) ? 'rgba(59,130,246,0.5)' : '#3b82f6',
                        color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 600,
                        cursor: (!file || analyzing) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                >
                    {analyzing ? (
                        <>
                            <div className="sz-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                            Analyzing Resume & Calculating Hire Score...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} /> Generate Master Hire Score
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ResumeUploadModal;
