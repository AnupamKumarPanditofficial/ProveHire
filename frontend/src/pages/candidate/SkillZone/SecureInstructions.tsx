import { useState, useRef, useEffect } from 'react';
import { HelpCircle, User, Shield, FileText, Eye, Mic, MonitorX, Smartphone, AlertTriangle, CheckCircle, Rocket, ArrowRight } from 'lucide-react';
import { testGeminiConnection } from '../../../services/geminiAssessment';
import { useProctoring } from './useProctoring';
import './SecureInstructions.css';

interface Props { onNavigate: (p: string) => void; }

const SecureInstructions = ({ onNavigate }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [checklist, setChecklist] = useState([false, false, false, false]);
    const [engineState, setEngineState] = useState<'idle' | 'loading' | 'ready'>('idle');
    const savedRole = sessionStorage.getItem('sz_target_role') || sessionStorage.getItem('sz_career') || 'Frontend Developer';
    const examTitle = `${savedRole} Skill Test`;
    // Live AI Proctoring & Webcam feed hook
    const { status: proctorStatus, activeViolation, audioLevels } = useProctoring(videoRef);

    // Strict Fullscreen Exit Monitoring
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                alert("Security Warning: You have exited fullscreen mode. You are being redirected to the Skill Selection area.");
                onNavigate('skill-zone');
            }
        };

        // If not already in fullscreen, request it immediately
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [onNavigate]);

    // Anti-Back Button Trap
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, '', window.location.href);
            alert("Security Warning: Browser navigation is disabled during secure sessions.");
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const toggleCheck = (idx: number) => {
        const newChecks = [...checklist];
        newChecks[idx] = !newChecks[idx];
        setChecklist(newChecks);
    };

    const isAllChecked = checklist.every(Boolean);

    const handleEngineClick = async () => {
        if (engineState !== 'idle') return;
        setEngineState('loading');
        
        try {
            const isConnected = await testGeminiConnection();
            if (isConnected) {
                setEngineState('ready');
            } else {
                alert("AI Engine connection failed. Please check your API config or try again later.");
                setEngineState('idle');
            }
        } catch (err) {
            console.error("AI check error", err);
            alert("Error connecting to AI Engine.");
            setEngineState('idle');
        }
    };

    const handleStartExam = () => {
        if (!isAllChecked || engineState !== 'ready') return;
        onNavigate('skill-zone/assessment');
    };

    return (
        <div className="si-root">
            {/* STICKY HEADER */}
            <header className="si-header">
                <div className="si-header-left">
                    <div className="si-webcam-thumb">
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div className="si-webcam-dot si-animate-ping" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>
                            AUDIO LEVEL
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {proctorStatus === 'active' ? (
                                <div className="si-audio-eq" style={{ alignItems: 'flex-end', height: '20px', gap: '3px' }}>
                                    {audioLevels.map((level, i) => (
                                        <div key={i} style={{ width: '4px', height: `${Math.max(10, level)}%`, backgroundColor: level > 80 ? '#ef4444' : level > 50 ? '#f59e0b' : '#10b981', borderRadius: '2px', transition: 'height 0.1s' }} />
                                    ))}
                                </div>
                            ) : (
                                <div className="si-audio-eq">
                                    <div className="si-audio-bar" />
                                    <div className="si-audio-bar" />
                                    <div className="si-audio-bar" />
                                    <div className="si-audio-bar" />
                                    <div className="si-audio-bar" />
                                </div>
                            )}
                            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>
                                {proctorStatus === 'initializing' ? 'Initializing AI...' : 'Live Monitoring Active'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="si-header-center">
                    READ AND FOLLOW INSTRUCTION
                </div>

                <div className="si-header-right">
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.7rem', color: '#ec5b13', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>System Status</span>
                        <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 600 }}>✓ Secure</span>
                    </div>
                    <button style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'grid', placeContent: 'center', color: '#cbd5e1', cursor: 'pointer' }}>
                        <HelpCircle size={20} />
                    </button>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#334155', display: 'grid', placeContent: 'center', color: '#fff' }}>
                        <User size={20} />
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="si-hero">
                <div className="si-hero-glow" />
                <div className="si-hero-content">
                    <div className="si-pill-badge">
                        <Shield size={16} /> High Security Environment
                    </div>
                    <h1 className="si-hero-title">{examTitle}</h1>
                    <p className="si-hero-subtitle">
                        This session is monitored by ProvaHire's strict AI proctoring system. 
                        Please review the final protocols before initializing the assessment engine.
                    </p>
                </div>

                <div className="si-hero-stats">
                    <div className="si-stat-row">
                        <span className="si-stat-label">Duration</span>
                        <span className="si-stat-value">30 Mins</span>
                    </div>
                    <div className="si-stat-row">
                        <span className="si-stat-label">Questions</span>
                        <span className="si-stat-value">30 Questions</span>
                    </div>
                    <div className="si-stat-row">
                        <span className="si-stat-label">Pass Mark</span>
                        <span className="si-stat-value" style={{ color: '#10b981' }}>85%</span>
                    </div>
                </div>
            </section>

            {/* MAIN 3-COLUMN GRID */}
            <main className="si-main">
                {/* Protocol Info (Left - 2 Cols) */}
                <div>
                    <div className="si-section-header">
                        <FileText size={24} color="#ec5b13" /> Examination Protocols
                    </div>

                    <div className="si-protocols-grid">
                        <div className="si-protocol-card">
                            <div className="si-icon-sq"><Eye size={24} /></div>
                            <h3>Eye Tracking</h3>
                            <p>Keeps track of where you are looking. Looking away from monitor flag you for review.</p>
                        </div>
                        <div className="si-protocol-card">
                            <div className="si-icon-sq"><Mic size={24} /></div>
                            <h3>Audio Monitoring</h3>
                            <p>Detects background voices, whispers, or unauthorized conversation in your physical environment.</p>
                        </div>
                        <div className="si-protocol-card">
                            <div className="si-icon-sq"><MonitorX size={24} /></div>
                            <h3>Browser Lockdown</h3>
                            <p>Tab switching, minimizing, or clicking outside the test window immediately logs an infraction.</p>
                        </div>
                        <div className="si-protocol-card">
                            <div className="si-icon-sq"><Smartphone size={24} /></div>
                            <h3>No Secondary Devices</h3>
                            <p>The use of phones, smartwatches, or tablets during this assessment is strictly prohibited.</p>
                        </div>
                    </div>

                    <div className="si-warning-box">
                        <AlertTriangle size={28} color="#ef4444" style={{ flexShrink: 0 }} />
                        <div>
                            <h4>Strict Proctoring Notice</h4>
                            <p>Any detection of cheating, impersonation, or violation of these protocols by our AI engines will result in immediate and permanent auto-rejection from this opportunity.</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right - 1 Col) */}
                <aside className="si-sidebar">
                    {/* Checklist */}
                    <div className="si-checklist-card">
                        <div className="si-checklist-header">
                            <CheckCircle color="#ec5b13" size={22} /> Pre-Exam Checklist
                        </div>
                        
                        <label className="si-check-item">
                            <input type="checkbox" className="si-checkbox" checked={checklist[0]} onChange={() => toggleCheck(0)} />
                            <span className="si-check-label">Webcam and Microphone are working</span>
                        </label>
                        <label className="si-check-item">
                            <input type="checkbox" className="si-checkbox" checked={checklist[1]} onChange={() => toggleCheck(1)} />
                            <span className="si-check-label">Stable internet connection verified</span>
                        </label>
                        <label className="si-check-item">
                            <input type="checkbox" className="si-checkbox" checked={checklist[2]} onChange={() => toggleCheck(2)} />
                            <span className="si-check-label">Desk is clear of all materials</span>
                        </label>
                        <label className="si-check-item">
                            <input type="checkbox" className="si-checkbox" checked={checklist[3]} onChange={() => toggleCheck(3)} />
                            <span className="si-check-label">I am alone in a private room</span>
                        </label>
                    </div>

                    {/* Final Verification Block */}
                    <div className="si-final-card">
                        <div className="si-final-header">
                            <div style={{ color: 'rgba(236, 91, 19, 0.8)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em' }}>FINAL VERIFICATION</div>
                            <div className="si-system-ready">
                                <div className="si-ready-dot si-animate-ping" style={{ animationDuration: '2s' }} /> SYSTEM READY
                            </div>
                        </div>

                        <div className={`si-engine-btn ${engineState === 'ready' ? 'success' : ''}`} onClick={handleEngineClick}>
                            <div className="si-engine-left">
                                <div className="si-engine-icon-wrap">
                                    {engineState === 'idle' && <Rocket size={20} />}
                                    {engineState === 'loading' && <div className="sz-spinner" style={{ width: 14, height: 14 }} />}
                                    {engineState === 'ready' && <CheckCircle size={20} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                                        {engineState === 'idle' ? 'Start Engine' : engineState === 'loading' ? 'Initializing...' : 'Engine Ready'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {engineState === 'idle' ? 'Boot up AI proctoring' : engineState === 'loading' ? 'Connecting to servers' : 'Connection secured'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            className="si-cta-btn" 
                            disabled={!isAllChecked || engineState !== 'ready'} 
                            onClick={handleStartExam}
                            title={(!isAllChecked || engineState !== 'ready') ? "Complete checklist and initialize engine first" : ""}
                        >
                            Start Exam Now <ArrowRight size={20} strokeWidth={2.5} />
                        </button>
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', marginTop: '-0.5rem' }}>
                            By clicking start, you agree to all terms above.
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="si-footer">
                <div className="si-footer-links">
                    <a href="#">System Requirements</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Technical Support</a>
                </div>
                <div>
                    © 2026 SecureExam Inc. All Rights Reserved. Session ID: #SEC-992-0X1
                </div>
            </footer>

            {/* Warning Overlay for Real-time AI Tracking */}
            {activeViolation && activeViolation.type !== 'environment' && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                    <div style={{ backgroundColor: '#1e293b', border: '1px solid #ef4444', borderRadius: '1rem', padding: '2.5rem', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: '1.5rem' }}>
                            <AlertTriangle size={36} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Proctoring Violation</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>{activeViolation.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SecureInstructions;
