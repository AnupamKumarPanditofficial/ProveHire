import { useState, useEffect, useCallback, useRef } from 'react';
import {
    AlertTriangle, ShieldAlert, Clock, ChevronRight,
    Send, CheckCircle
} from 'lucide-react';
import { useProctoring } from './useProctoring';
import { useAssessmentTimer } from '../../../hooks/useAssessmentTimer';
import { generateAssessmentQuestions, evaluateAssessment } from '../../../services/geminiAssessment';
import type { Question, ViolationType, Violation, AssessmentState } from '../../../types/assessment.types';
import './Assessment.css';

interface Props { onNavigate: (p: string) => void; }

const Assessment = ({ onNavigate }: Props) => {
    // ── Pre-flight Checks ──────────────────────────────────────────
    const permissionsStr = sessionStorage.getItem('permissionsGranted');
    const roleStr = sessionStorage.getItem('sz_target_role') || sessionStorage.getItem('sz_career');
    const questionCount = parseInt(sessionStorage.getItem('sz_question_count') || '30');
    const skillName = sessionStorage.getItem('sz_subject') || roleStr;

    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    // ── State Management ───────────────────────────────────────────
    const [state, setState] = useState<AssessmentState>({
        questions: [],
        currentIndex: 0,
        answers: new Map(),
        markedForReview: new Set(),
        questionTimer: 40,
        totalTimeElapsed: 0,
        violations: [],
        warningCount: 0,
        status: 'loading',
        isFullscreen: false
    });

    // Need refs for latest state values inside intervals/callbacks
    const stateRef = useRef(state);
    const lastViolTime = useRef(0);
    useEffect(() => { stateRef.current = state; }, [state]);

    // ── Initialize ───────────────────────────────────────────────
    useEffect(() => {
        // Validation
        if (!permissionsStr || permissionsStr !== 'true' || !roleStr) {
            onNavigate('skill-zone/instructions');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('sz_attempts_date');
        const count = parseInt(localStorage.getItem('sz_attempts_count') || '0');

        if (storedDate === todayStr && count >= 3) {
            alert(`You have used all 3 assessment attempts for today. Please wait until tomorrow.`);
            onNavigate('skill-zone');
            return;
        }

        setIsAuthorized(true);

        // Load or Generate Questions
        const loadAssessment = async () => {
            try {
                // Check sessionStorage for recovery
                const recoveredStr = sessionStorage.getItem('sz_in_progress');
                if (recoveredStr) {
                    const parsed = JSON.parse(recoveredStr);
                    // Rehydrate Map/Set objects
                    parsed.answers = new Map(Object.entries(parsed.answers).map(([k, v]) => [Number(k), v]));
                    parsed.markedForReview = new Set(parsed.markedForReview);
                    setState(parsed);
                    return;
                }

                // Record attempt start
                const currentCount = (storedDate === todayStr) ? count : 0;
                localStorage.setItem('sz_attempts_date', todayStr);
                localStorage.setItem('sz_attempts_count', (currentCount + 1).toString());

                const qs = await generateAssessmentQuestions(skillName || 'General', "2-5 years", questionCount);
                setState(prev => ({
                    ...prev,
                    questions: qs,
                    status: 'active'
                }));
            } catch (err) {
                console.error("Initialization error:", err);
                handleViolation('TAB_SWITCH', "Failed to connect to AI engine. Please check your connection and try again.");
            }
        };

        if (isAuthorized) {
            loadAssessment();

            // Enforce fullscreen immediately when authorized
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(console.warn);
            }
        }
    }, [isAuthorized, roleStr, skillName, questionCount, permissionsStr, onNavigate]);

    // ── Hooks ───────────────────────────────────────────────────
    const handleViolation = useCallback((type: ViolationType, details = '') => {
        if (stateRef.current.status !== 'active') return;

        const now = Date.now();
        // Prevent double triggers within 2 seconds (e.g. blur + visibilitychange triggering at once)
        if (now - lastViolTime.current < 2000) return;
        lastViolTime.current = now;

        const viol: Violation = {
            type,
            timestamp: new Date(),
            questionIndex: stateRef.current.currentIndex,
            details
        };

        const currentWarnings = stateRef.current.warningCount;
        const nextCount = currentWarnings + 1;

        setState(prev => {
            const updated = {
                ...prev,
                violations: [...prev.violations, viol],
                warningCount: nextCount
            };
            return updated;
        });

        if (nextCount === 3) {
            handleFinalSubmit();
        }
    }, []);

    const videoRef = useRef<HTMLVideoElement>(null);
    const { status: proctorStatus, activeViolation, violationLog, audioLevels } = useProctoring(videoRef);

    // Sync proctoring hook violations to assessment state history
    useEffect(() => {
        if (activeViolation && state.status === 'active') {
            // Map the hook's violation to the assessment's violation types
            let mappedType: ViolationType = 'MULTIPLE_FACES';
            if (activeViolation.type === 'environment') mappedType = 'TAB_SWITCH';
            else if (activeViolation.type === 'audio') mappedType = 'NOISE_DETECTED';
            else if (activeViolation.message.includes('Face not detected')) mappedType = 'NO_FACE';
            else if (activeViolation.message.includes('Eye gaze')) mappedType = 'LOOKING_AWAY';
            
            handleViolation(mappedType, activeViolation.message);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeViolation]);

    // Block browser back button
    useEffect(() => {
        if (!isAuthorized) return;
        window.history.pushState(null, '', window.location.href);
        const handlePopState = (e: PopStateEvent) => {
            if (stateRef.current.status === 'active') {
                e.preventDefault();
                handleViolation('TAB_SWITCH', 'Attempted to use browser back button');
                window.history.pushState(null, '', window.location.href);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isAuthorized, handleViolation]);

    // Persistent storage saver
    useEffect(() => {
        if (state.status === 'loading' || state.questions.length === 0) return;
        // Don't save if submitted
        if (state.status === 'submitted') {
            sessionStorage.removeItem('sz_in_progress');
            return;
        }

        const toSave = {
            ...state,
            answers: Object.fromEntries(state.answers),
            markedForReview: Array.from(state.markedForReview)
        };
        sessionStorage.setItem('sz_in_progress', JSON.stringify(toSave));
    }, [state]);

    // Timer logic
    const handleTimeUp = useCallback(() => {
        if (stateRef.current.status !== 'active') return;

        setState(prev => {
            if (prev.currentIndex < prev.questions.length - 1) {
                return { ...prev, currentIndex: prev.currentIndex + 1, questionTimer: 40 };
            } else {
                return { ...prev, status: 'submitted' };
            }
        });

        if (stateRef.current.currentIndex === stateRef.current.questions.length - 1) {
            handleFinalSubmit();
        }
    }, []);

    const { questionTimer, totalTimeElapsed, resetQuestionTimer } = useAssessmentTimer({
        initialQuestionTime: 40,
        isActive: state.status === 'active',
        onTimeUp: handleTimeUp
    });

    // ── Actions ──────────────────────────────────────────────────
    const handleOptionSelect = (idx: number) => {
        setState(prev => {
            const newAnswers = new Map(prev.answers);
            newAnswers.set(prev.currentIndex, idx);
            return { ...prev, answers: newAnswers };
        });
    };

    const handleNext = () => {
        setState(prev => {
            if (prev.currentIndex < prev.questions.length - 1) {
                resetQuestionTimer();
                return { ...prev, currentIndex: prev.currentIndex + 1 };
            }
            return prev;
        });
    };

    const handleFinalSubmit = async () => {
        setState(prev => ({ ...prev, status: 'loading' })); // repurpose loading for eval state

        const latest = stateRef.current; // Grab latest ref immediately

        try {
            // Remove the 7 day cooldown marker (it's handled by daily attempts now)
            localStorage.removeItem('sz_last_attempt');

            const result = await evaluateAssessment(
                latest.questions,
                latest.answers,
                latest.violations,
                totalTimeElapsed,
                skillName || 'Unknown'
            );

            // In a real app we'd POST to backend here, e.g.
            // await fetch('/api/assessment/submit', { method: 'POST', body: JSON.stringify(result) });

            // Embed the original questions and user answers for the Result page review
            const finalPayload = {
                ...result,
                paperDetails: {
                    questions: latest.questions,
                    answers: Object.fromEntries(latest.answers)
                }
            };

            sessionStorage.setItem('sz_result', JSON.stringify(finalPayload));
            sessionStorage.removeItem('sz_in_progress');

            // Ensure exit fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }

            onNavigate('skill-zone/result');

        } catch (err) {
            console.error("Evaluation Failed:", err);
            handleViolation('TAB_SWITCH', "Failed to generate final report. We saved your answers. Please try again.");
            setState(prev => ({ ...prev, status: 'active' })); // return to active so they can try submit again
        }
    };

    // ── Render Helpers ───────────────────────────────────────────
    if (!isAuthorized) return null;

    if (state.status === 'loading') {
        return (
            <div className="sz-root" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="sz-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
                    <h2 style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>
                        {state.questions.length === 0 ? "Generating Adaptive Questions..." : "Evaluating Result..."}
                    </h2>
                    <p style={{ color: '#64748b' }}>Please wait. Do not close this tab.</p>
                </div>
            </div>
        );
    }

    const currentQ: Question | undefined = state.questions[state.currentIndex];
    if (!currentQ) return null; // Safety boundary

    const progressPerc = Math.round(((state.currentIndex + 1) / state.questions.length) * 100);

    return (
        <div className="sz-assess-root">
            {/* Header Strip */}
            <div className="sz-assess-header">
                <div className="sz-h-left">
                    <ShieldAlert size={18} color={state.warningCount > 0 ? "#f59e0b" : "#10b981"} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {proctorStatus === 'initializing' ? 'Initializing AI Engine...' : 'Live Monitoring Active'}
                    </span>
                    {proctorStatus === 'active' && (
                        <div className="sz-audio-eq-container">
                            {audioLevels.map((level, i) => (
                                <div key={i} className="sz-eq-bar" style={{ height: `${level}%`, background: level > 80 ? '#ef4444' : level > 50 ? '#f59e0b' : '#10b981' }} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="sz-h-center">
                    <div className="sz-progress-bar">
                        <div className="sz-progress-fill" style={{ width: `${progressPerc}%` }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                        Question {state.currentIndex + 1} of {state.questions.length}
                    </span>
                </div>

                <div className="sz-h-right">
                    <div className={`sz-timer ${questionTimer <= 10 ? 'danger' : ''}`}>
                        <Clock size={16} /> 00:{questionTimer < 10 ? `0${questionTimer}` : questionTimer}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="sz-assess-main">
                {/* Left Panel: Question */}
                <div className="sz-q-panel">
                    <div className="sz-q-meta">
                        <span className="sz-q-badge" style={{ background: currentQ.difficulty === 'hard' ? 'rgba(239,68,68,0.1)' : currentQ.difficulty === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: currentQ.difficulty === 'hard' ? '#ef4444' : currentQ.difficulty === 'medium' ? '#f59e0b' : '#10b981' }}>
                            {currentQ.difficulty.toUpperCase()}
                        </span>
                        <span className="sz-q-badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                            {currentQ.topic}
                        </span>
                    </div>

                    <h2 className="sz-q-text">{currentQ.question}</h2>

                    {currentQ.type === 'code' && currentQ.code && (
                        <div className="sz-q-code">
                            <pre><code>{currentQ.code}</code></pre>
                            <span className="sz-q-lang">{currentQ.language || 'Code Snippet'}</span>
                        </div>
                    )}
                </div>

                {/* Right Panel: Options */}
                <div className="sz-opt-panel">
                    {currentQ.options.map((opt, idx) => {
                        const isSelected = state.answers.get(state.currentIndex) === idx;
                        return (
                            <button
                                key={idx}
                                className={`sz-opt-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleOptionSelect(idx)}
                            >
                                <span className="sz-opt-letter">{String.fromCharCode(65 + idx)}</span>
                                <span className="sz-opt-text">{opt}</span>
                                {isSelected && <CheckCircle size={18} className="sz-opt-check" />}
                            </button>
                        );
                    })}
                </div>

                {/* Secure Anti-AI Warning */}
                <div style={{ marginTop: '2.5rem', gridColumn: '1 / -1', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', opacity: 0.8 }}>
                    If a user captures the exam screen and attempts to retrieve answers using external AI tools or image recognition systems, the system may detect suspicious behavior and block the attempt.
                </div>
            </div>

            {/* Footer Strip */}
            <div className="sz-assess-footer">
                <div className="sz-f-streams">
                    <div className="sz-stream-box">
                        <video ref={videoRef} autoPlay playsInline muted />
                    </div>
                </div>

                <div className="sz-f-actions">
                    {state.currentIndex < state.questions.length - 1 ? (
                        <button
                            className={`sz-btn-primary ${!state.answers.has(state.currentIndex) ? 'disabled' : ''}`}
                            onClick={handleNext}
                            disabled={!state.answers.has(state.currentIndex)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none' }}>
                                Next Question <ChevronRight size={16} />
                            </span>
                        </button>
                    ) : (
                        <button
                            className={`sz-btn-primary sz-btn-start ${!state.answers.has(state.currentIndex) ? 'disabled' : ''}`}
                            onClick={handleFinalSubmit}
                            disabled={!state.answers.has(state.currentIndex)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none' }}>
                                Submit Assessment <Send size={16} />
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Warning Overlay */}
            {activeViolation && (
                <div className="sz-warning-overlay">
                    <div className="sz-warning-modal">
                        <div className="sz-warn-icon"><AlertTriangle size={32} /></div>
                        <h3>Proctoring Violation</h3>
                        <p>{activeViolation.message}</p>
                        <button className="sz-btn-primary sz-btn-alert" onClick={() => {
                            if (state.warningCount >= 3) {
                                handleFinalSubmit();
                            } else {
                                if (!document.fullscreenElement) {
                                    document.documentElement.requestFullscreen().catch(() => { });
                                }
                            }
                        }}>
                            Acknowledge & Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Live Proctoring Log */}
            <div className="sz-proctoring-log">
                <div className="sz-plog-header">
                    <span>Proctoring Engine</span>
                    <div className="sz-plog-status">
                         <div style={{width: 6, height: 6, borderRadius: '50%', background: proctorStatus === 'initializing' ? '#f59e0b' : '#10b981', animation: 'pulseDanger 2s infinite'}} />
                         {proctorStatus === 'initializing' ? 'Booting...' : 'Active'}
                    </div>
                </div>
                <div className="sz-plog-list">
                    {violationLog.slice(0, 4).map((v) => (
                        <div key={v.id} className="sz-plog-item">
                            <div className="sz-plog-time">{new Date(v.timestamp).toLocaleTimeString()}</div>
                            <div className="sz-plog-msg">{v.message}</div>
                        </div>
                    ))}
                    {violationLog.length === 0 && (
                        <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                            Environment secure. No violations logged.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Assessment;
