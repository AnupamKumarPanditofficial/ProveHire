import { useState, useEffect, useRef } from 'react';
import { Shield, Camera, Mic, Maximize, CheckCircle2, AlertCircle } from 'lucide-react';
import CandidateHeader from '../../../components/CandidateHeader';
import { ParticleCanvas } from './ParticleCanvas';

interface Props { onNavigate: (p: string) => void; }

const Permissions = ({ onNavigate }: Props) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'checking' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'checking' | 'granted' | 'denied'>('pending');
    const [screenStatus, setScreenStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

    const [noiseLevel, setNoiseLevel] = useState(0);

    // Guard route
    useEffect(() => {
        const savedRole = sessionStorage.getItem('sz_target_role') || sessionStorage.getItem('sz_career');
        if (!savedRole) {
            onNavigate('skill-zone');
        }
    }, [onNavigate]);

    const requestCamera = async () => {
        setCameraStatus('checking');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraStatus('granted');
        } catch (err) {
            console.error(err);
            setCameraStatus('denied');
        }
    };

    const requestMic = async () => {
        setMicStatus('checking');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Simple visualizer setup
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateNoise = () => {
                if (stream.active) {
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
                    setNoiseLevel(Math.min(100, (avg / 128) * 100)); // Normalize approx
                    requestAnimationFrame(updateNoise);
                }
            };
            updateNoise();

            setMicStatus('granted');
        } catch (err) {
            console.error(err);
            setMicStatus('denied');
        }
    };

    const requestFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
            setScreenStatus('granted');
        } catch (err) {
            console.error(err);
            setScreenStatus('denied');
        }
    };

    // Removed API check as requested

    // Cleanup streams on unmount
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const allReady = cameraStatus === 'granted' && micStatus === 'granted' && screenStatus === 'granted';

    const handleStart = () => {
        if (!allReady) return;
        sessionStorage.setItem('permissionsGranted', 'true');
        onNavigate('skill-zone/secure-instructions');
    };

    const renderStatusIcon = (status: string) => {
        if (status === 'granted') return <CheckCircle2 size={18} color="#10b981" />;
        if (status === 'denied') return <AlertCircle size={18} color="#ef4444" />;
        if (status === 'checking') return <span className="sz-spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />;
        return <AlertCircle size={18} color="#f59e0b" />;
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
                            <div className={`sz-step-dot ${5 >= s ? 'active' : ''} ${5 > s ? 'done' : ''}`}>
                                {5 > s ? '✓' : s}
                            </div>
                            <span className={`sz-step-label ${5 === s ? 'active' : ''}`} style={{ fontSize: '0.7rem' }}>
                                {s === 1 ? 'Career' : s === 2 ? 'Experience' : s === 3 ? 'Resume' : s === 4 ? 'Rules' : 'Setup'}
                            </span>
                            {s < 5 && <div className={`sz-step-line ${5 > s ? 'done' : ''}`} />}
                        </div>
                    ))}
                </div>

                <div className="sz-step-panel sz-step4" style={{ maxWidth: 900 }}>
                    <div className="sz-hero-badge"><Shield size={13} /> System Integrity Check</div>
                    <h1 className="sz-title">Environment <span className="sz-accent">Permissions</span></h1>
                    <p className="sz-subtitle" style={{ marginBottom: '2.5rem' }}>We need access to your camera, microphone, and a secure fullscreen view to ensure academic integrity.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', width: '100%', alignItems: 'stretch' }}>

                        {/* Permissions List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', justifyContent: 'space-between' }}>

                            {/* Camera */}
                            <div style={{ 
                                background: cameraStatus === 'granted' ? 'rgba(59,130,246,0.08)' : 'rgba(20,27,43,0.8)', 
                                border: `1px solid ${cameraStatus === 'granted' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`, 
                                borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Camera size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.1rem' }}>Webcam Access</h4>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Required for live AI face proctoring.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {renderStatusIcon(cameraStatus)}
                                    {cameraStatus !== 'granted' && (
                                        <button onClick={requestCamera} style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                            {cameraStatus === 'denied' ? 'Retry' : 'Allow'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Mic */}
                            <div style={{ 
                                background: micStatus === 'granted' ? 'rgba(139,92,246,0.08)' : 'rgba(20,27,43,0.8)', 
                                border: `1px solid ${micStatus === 'granted' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`, 
                                borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Mic size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.1rem' }}>Microphone Access</h4>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Detects unauthorized background presence.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {renderStatusIcon(micStatus)}
                                    {micStatus !== 'granted' && (
                                        <button onClick={requestMic} style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                            {micStatus === 'denied' ? 'Retry' : 'Allow'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Fullscreen */}
                            <div style={{ 
                                background: screenStatus === 'granted' ? 'rgba(16,185,129,0.08)' : 'rgba(20,27,43,0.8)', 
                                border: `1px solid ${screenStatus === 'granted' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, 
                                borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: 40, height: 40, background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Maximize size={20} />
                                    </div>
                                    <div>
                                        <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.1rem' }}>Secure Fullscreen</h4>
                                        <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Locks environment to prevent tab switching.</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {renderStatusIcon(screenStatus)}
                                    {screenStatus !== 'granted' && (
                                        <button onClick={requestFullscreen} style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                                            {screenStatus === 'denied' ? 'Retry' : 'Enter'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Preview panel */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1, minHeight: 220, background: '#000', position: 'relative' }}>
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: cameraStatus === 'granted' ? 1 : 0.2 }} />
                                {cameraStatus !== 'granted' && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                                        Camera Preview
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Mic Level</span>
                                    <span>{micStatus === 'granted' ? 'Active' : 'Muted'}</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${noiseLevel}%`, height: '100%', background: noiseLevel > 80 ? '#ef4444' : '#10b981', transition: 'width 0.1s ease-out, background 0.3s' }} />
                                </div>
                            </div>
                        </div>

                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', width: '100%' }}>
                        <button className="sz-back-btn" onClick={() => onNavigate('skill-zone/instructions')} style={{ margin: 0, padding: '0.85rem 2rem', background: 'rgba(255,255,255,0.05)' }}>
                            Go Back
                        </button>
                        <button
                            className={`sz-btn-primary ${!allReady ? 'disabled' : ''}`}
                            onClick={handleStart}
                            disabled={!allReady}
                        >
                            Next
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Permissions;
