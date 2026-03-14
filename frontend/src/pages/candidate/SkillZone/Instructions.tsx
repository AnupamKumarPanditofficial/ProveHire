import { useState } from 'react';
import { ShieldAlert, AlertTriangle, FileText, CheckSquare, ChevronRight } from 'lucide-react';
import CandidateHeader from '../../../components/CandidateHeader';
import { ParticleCanvas } from './ParticleCanvas';

interface Props { onNavigate: (p: string) => void; }

const Instructions = ({ onNavigate }: Props) => {
    const [accepted, setAccepted] = useState(false);

    // Guard route
    const savedRole = sessionStorage.getItem('sz_target_role') || sessionStorage.getItem('sz_career');
    if (!savedRole) {
        onNavigate('skill-zone');
        return null;
    }

    // Attempt Limit Logic (3 per day)
    const todayStr = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('sz_attempts_date');
    const storedCount = parseInt(localStorage.getItem('sz_attempts_count') || '0');

    let attemptsLeft = 3;
    if (storedDate === todayStr) {
        attemptsLeft = Math.max(0, 3 - storedCount);
    }

    const handleProceed = () => {
        if (!accepted) return;
        onNavigate('skill-zone/permissions');
    };

    return (
        <div className="sz-root">
            <ParticleCanvas />

            <div className="sz-glow sz-glow1" />
            <div className="sz-glow sz-glow2" />

            <CandidateHeader activePage="skill-zone" onNavigate={onNavigate} />

            <div className="sz-content">
                <div className="sz-steps-indicator">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className="sz-step-item" style={{ flex: '1 1 0' }}>
                            <div className={`sz-step-dot ${4 >= s ? 'active' : ''} ${4 > s ? 'done' : ''}`}>
                                {4 > s ? '✓' : s}
                            </div>
                            <span className={`sz-step-label ${4 === s ? 'active' : ''}`} style={{ fontSize: '0.7rem' }}>
                                {s === 1 ? 'Career' : s === 2 ? 'Experience' : s === 3 ? 'Resume' : s === 4 ? 'Rules' : 'Setup'}
                            </span>
                            {s < 5 && <div className={`sz-step-line ${4 > s ? 'done' : ''}`} />}
                        </div>
                    ))}
                </div>

                <div className="sz-step-panel sz-step3" style={{ maxWidth: 800 }}>
                    <button className="sz-back-btn" onClick={() => onNavigate('skill-zone/resume')}>← Back</button>

                    <div className="sz-hero-badge" style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
                        <ShieldAlert size={13} /> Strict Proctoring Environment
                    </div>

                    <h1 className="sz-title">Assessment <span className="sz-accent" style={{ color: '#fff' }}>Rules & Structure</span></h1>
                    <p className="sz-subtitle" style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>Please read the following rules carefully. Violations will result in immediate termination.</p>

                    {attemptsLeft === 0 && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                            <strong>Daily Limit Reached</strong><br />
                            You have used all 3 attempts for today. Please return tomorrow.
                        </div>
                    )}

                    <div className="sz-rules-container" style={{
                        background: 'rgba(20,27,43,0.7)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '2rem',
                        backdropFilter: 'blur(16px)',
                        width: '100%',
                        textAlign: 'left',
                        marginBottom: '2rem'
                    }}>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ color: '#3b82f6', marginTop: '2px' }}><FileText size={20} /></div>
                                <div>
                                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.4rem' }}>Exam Structure</h3>
                                    <ul style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.2rem' }}>
                                        <li><strong>45 AI-generated Multiple Choice Questions</strong> tailored to your experience.</li>
                                        <li>25 Theory/Concept questions and 20 Code snippet questions.</li>
                                        <li>You have exactly <strong>40 seconds per question</strong>. If time runs out, it auto-advances.</li>
                                        <li>Once you answer a question, you <strong>cannot</strong> go back.</li>
                                    </ul>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div style={{ color: '#f59e0b', marginTop: '2px' }}><AlertTriangle size={20} /></div>
                                <div>
                                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.4rem' }}>Proctoring Rules (Anti-Cheat)</h3>
                                    <ul style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', paddingLeft: '1.2rem' }}>
                                        <li><strong>Fullscreen Required:</strong> Exiting fullscreen will issue a warning.</li>
                                        <li><strong>No Tab Switching:</strong> Navigating away from the browser tab is strictly monitored.</li>
                                        <li><strong>Webcam AI Analysis:</strong> Your face must remain clearly visible. Multiple faces or looking away will flag an integrity violation.</li>
                                        <li><strong>Microphone Active:</strong> Background noise above the threshold will be recorded as a violation.</li>
                                        <li>Copying, pasting, and using Developer Tools (F12) are disabled.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '2rem',
                            paddingTop: '1.5rem',
                            borderTop: '1px dashed rgba(255,255,255,0.1)',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            cursor: 'pointer'
                        }} onClick={() => setAccepted(!accepted)}>
                            <div style={{
                                width: '24px', height: '24px',
                                border: `2px solid ${accepted ? '#10b981' : 'rgba(255,255,255,0.2)'}`,
                                background: accepted ? '#10b981' : 'transparent',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}>
                                {accepted && <CheckSquare size={16} color="#fff" />}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: accepted ? '#fff' : '#94a3b8', userSelect: 'none' }}>
                                I agree to the rules and understand that violations will negatively impact my Integrity Score.
                            </span>
                        </div>
                    </div>

                    <button
                        className={`sz-btn-primary ${(!accepted || attemptsLeft === 0) ? 'disabled' : ''}`}
                        onClick={handleProceed}
                        disabled={!accepted || attemptsLeft === 0}
                    >
                        {attemptsLeft === 0 ? 'Daily Limit Exceeded' : `Proceed to Equipment Setup (Attempts Left: ${attemptsLeft})`} <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Instructions;
