import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Sparkles, Shield, Archive, Lock, CheckCircle2, RotateCcw, Trophy, Target } from 'lucide-react';
import CandidateHeader from '../../../components/CandidateHeader';
import { getProfile, saveProfile } from '../../../utils/profileStore';
import { fetchTopSkills, type RecommendedSkill } from '../../../services/geminiAssessment';
import { CAREERS } from './careersData';
import './SkillZone.css';
import { ParticleCanvas } from './ParticleCanvas';
import ResumeUploadModal from './ResumeUploadModal';

// ── Types ─────────────────────────────────────────────────────
interface Props { onNavigate: (p: string) => void; }
type Step = 'role' | 'hub' | 'loading_exam' | 'exam';

// ── sessionStorage keys for state persistence (BUG #2 fix) ───
const SK = {
    STEP: 'sz_current_step',
    ROLE: 'sz_target_role',
    SKILLS: 'sz_skills_cache',
    TAB: 'sz_active_tab',
};

// ── Helper: read completed tests from history ────────────────
function getCompletedTests(): Set<string> {
    try {
        const raw = localStorage.getItem('sz_history');
        if (!raw) return new Set();
        const history = JSON.parse(raw) as { domain: string; status: string }[];
        // Consider a test "completed" regardless of pass/fail — they attempted it
        return new Set(history.map(h => h.domain));
    } catch { return new Set(); }
}

const SkillZone = ({ onNavigate }: Props) => {
    const profile = getProfile();

    // ── Restore persisted state (BUG #2 + FEATURE #1) ────────
    const savedStep = sessionStorage.getItem(SK.STEP) as Step | null;
    const savedRole = sessionStorage.getItem(SK.ROLE) || profile.targetRole || '';
    const savedSkillsStr = sessionStorage.getItem(SK.SKILLS);
    const savedSkills = savedSkillsStr ? JSON.parse(savedSkillsStr) as RecommendedSkill[] : [];

    // Determine initial step: if profile has targetRole, skip to hub
    const resolveInitialStep = (): Step => {
        if (savedStep === 'hub') return 'hub';
        if (profile.targetRole) return 'hub';
        return 'role';
    };

    const [step, setStep] = useState<Step>(resolveInitialStep());
    const [targetRole, setTargetRole] = useState(savedRole);

    // UI Tab State (which card is clicked)
    const savedTab = sessionStorage.getItem(SK.TAB) as 'hub' | 'history' | null;
    const [activeTab, setActiveTab] = useState<'hub' | 'history'>(savedTab || 'hub');

    // AI Recommended Skills State
    const [recommendedSkills, setRecommendedSkills] = useState<RecommendedSkill[]>(savedSkills);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    
    // Modal State
    const [showResumeModal, setShowResumeModal] = useState(false);

    // Track completed tests for journey UI (FEATURE #2)
    const [completedTests, setCompletedTests] = useState<Set<string>>(getCompletedTests());

    // Ref to prevent duplicate skill fetches on tab return
    const isRestoringRef = useRef(false);
    const hasFetchedSkillsRef = useRef(savedSkills.length > 0);

    // ── Persist state changes to sessionStorage (BUG #2 fix) ─
    useEffect(() => {
        sessionStorage.setItem(SK.STEP, step);
    }, [step]);

    useEffect(() => {
        if (targetRole) sessionStorage.setItem(SK.ROLE, targetRole);
    }, [targetRole]);

    useEffect(() => {
        sessionStorage.setItem(SK.TAB, activeTab);
    }, [activeTab]);

    // ── Load history from localStorage ───────────────────────
    useEffect(() => {
        const hStr = localStorage.getItem('sz_history');
        if (hStr) {
            try {
                const parsed = JSON.parse(hStr);
                setHistory(parsed);
                setCompletedTests(getCompletedTests());
            } catch (e) { }
        }
    }, []);

    // ── Visibility change handler (BUG #2 fix) ──────────────
    // Prevents full re-initialization when returning to the tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Mark that we're restoring — skip any API refetch
                isRestoringRef.current = true;

                // Refresh completed tests from localStorage (might have changed)
                setCompletedTests(getCompletedTests());

                // Reset the restoring flag after a tick
                setTimeout(() => { isRestoringRef.current = false; }, 500);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // ── Load skills if we are in hub ─────────────────────────
    useEffect(() => {
        if (step === 'hub' && targetRole && !hasFetchedSkillsRef.current && !isRestoringRef.current) {
            // Check sessionStorage cache first
            const cached = sessionStorage.getItem(SK.SKILLS);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (parsed.length > 0) {
                        setRecommendedSkills(parsed);
                        hasFetchedSkillsRef.current = true;
                        return;
                    }
                } catch { }
            }

            setLoadingSkills(true);
            fetchTopSkills(targetRole)
                .then(skills => {
                    setRecommendedSkills(skills);
                    sessionStorage.setItem(SK.SKILLS, JSON.stringify(skills));
                    hasFetchedSkillsRef.current = true;
                })
                .catch(err => console.error("Failed to load skills:", err))
                .finally(() => setLoadingSkills(false));
        }
    }, [step, targetRole]);

    // ── Handlers ──────────────────────────────────────────────────

    const startInitialSetup = (roleTitle: string) => {
        if (!roleTitle) return;
        setTargetRole(roleTitle);
        saveProfile({ targetRole: roleTitle });
        setStep('hub');
    };

    // ── Reset handler (FEATURE #1) — allows changing role ─
    const handleReset = useCallback(() => {
        // Clear cached state
        sessionStorage.removeItem(SK.STEP);
        sessionStorage.removeItem(SK.ROLE);
        sessionStorage.removeItem(SK.SKILLS);
        sessionStorage.removeItem(SK.TAB);
        hasFetchedSkillsRef.current = false;

        // Reset component state
        setTargetRole('');
        setRecommendedSkills([]);
        setStep('role');
    }, []);

    const startExam = async (title: string, count: number) => {
        sessionStorage.setItem('sz_target_role', targetRole);
        sessionStorage.setItem('sz_question_count', count.toString());
        sessionStorage.setItem('sz_subject', title);
        sessionStorage.setItem('permissionsGranted', 'true');

        console.log(`Starting ${title} with ${count} questions`);
        onNavigate('skill-zone/instructions');
    };

    // ── Journey Logic (FEATURE #2) ──────────────────────────────
    // Determine test status for journey roadmap
    const getTestStatus = (skillName: string, index: number): 'completed' | 'in-progress' | 'locked' => {
        if (completedTests.has(skillName)) return 'completed';
        // First skill is always unlocked; others unlock when the previous one is completed
        if (index === 0) return 'in-progress';
        const prevSkill = recommendedSkills[index - 1];
        if (prevSkill && completedTests.has(prevSkill.name)) return 'in-progress';
        return 'locked';
    };

    // Final exam unlocks when at least 2 skill tests are completed
    const completedSkillTestCount = recommendedSkills.filter(s => completedTests.has(s.name)).length;
    const finalExamUnlocked = completedSkillTestCount >= 2;

    // Check if final exam has been completed
    const finalExamCompleted = completedTests.has('Main Role Test');

    // Read hire score from profile
    const hireScore = profile.hireScore;

    // ── Render Helpers ────────────────────────────────────────────

    const renderRoleStep = () => (
        <div className="sz-step-panel">
            <div className="sz-hero-badge"><Zap size={13} /> Step 1: Career Definition</div>
            <h1 className="sz-title">Define Your <span className="sz-accent">Target Role</span></h1>
            <p className="sz-subtitle">Select a predefined career path to build a specific validation environment for your skills.</p>

            <div className="sz-career-grid">
                {CAREERS.map((career) => {
                    const isSelected = targetRole === career.title;
                    return (
                        <div
                            key={career.id}
                            className={`sz-career-card ${isSelected ? 'selected' : ''}`}
                            style={{ '--card-color': career.color } as React.CSSProperties}
                            onClick={() => startInitialSetup(career.title)}
                        >
                            {isSelected && <div className="sz-card-selected-ring" style={{ borderColor: career.color }} />}
                            <div className="sz-card-icon" style={{
                                background: career.glow,
                                color: career.color,
                                border: `1px solid ${career.color}40`,
                                boxShadow: `0 0 20px ${career.glow}`
                            }}>
                                {career.icon}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                <h3 className="sz-card-title">{career.title}</h3>
                                <p className="sz-card-desc">{career.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    // ── Journey Milestone Component (FEATURE #2) ────────────────
    const renderJourneyMilestone = (
        name: string,
        icon: string,
        importance: string,
        index: number,
        questionCount: number,
        isLast: boolean
    ) => {
        const status = getTestStatus(name, index);
        const statusColors = {
            'completed': { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', dot: '#10b981', text: '#34d399' },
            'in-progress': { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', dot: '#3b82f6', text: '#60a5fa' },
            'locked': { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', dot: '#334155', text: '#475569' },
        };
        const c = statusColors[status];

        return (
            <div key={name} className="sz-journey-milestone" style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                {/* Vertical connector line */}
                {!isLast && (
                    <div style={{
                        position: 'absolute', left: '19px', top: '44px', width: '2px', height: 'calc(100% - 4px)',
                        background: status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
                        transition: 'background 0.3s'
                    }} />
                )}

                {/* Milestone dot */}
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: c.bg, border: `2px solid ${c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', transition: 'all 0.3s', zIndex: 2,
                    boxShadow: status === 'in-progress' ? '0 0 16px rgba(59,130,246,0.25)' : 'none'
                }}>
                    {status === 'completed' ? <CheckCircle2 size={18} color="#10b981" /> :
                        status === 'locked' ? <Lock size={14} color="#475569" /> :
                            <span>{icon}</span>}
                </div>

                {/* Milestone content card */}
                <div style={{
                    flex: 1, background: c.bg, border: `1px solid ${c.border}`,
                    borderRadius: '16px', padding: '1.25rem 1.5rem',
                    opacity: status === 'locked' ? 0.5 : 1,
                    transition: 'all 0.3s', marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: status === 'locked' ? '#475569' : '#f8fafc', marginBottom: '0.25rem' }}>
                                {name}
                            </h4>
                            <span style={{
                                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px',
                                color: c.text, textTransform: 'uppercase' as const
                            }}>
                                {status === 'completed' ? '✓ COMPLETED' : status === 'in-progress' ? `${questionCount} QUESTIONS` : '🔒 LOCKED'}
                            </span>
                        </div>
                        {status === 'in-progress' && (
                            <button
                                className="sz-btn-primary sz-btn-sm"
                                style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem' }}
                                onClick={() => startExam(name, questionCount)}
                            >
                                Start Test
                            </button>
                        )}
                        {status === 'completed' && (
                            <div style={{
                                padding: '0.35rem 0.85rem', background: 'rgba(16,185,129,0.1)',
                                border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px',
                                fontSize: '0.75rem', fontWeight: 700, color: '#10b981'
                            }}>
                                Done
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{importance}</p>
                </div>
            </div>
        );
    };

    const renderHub = () => (
        <div className="sz-hub-panel" style={{ width: '100%', maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Skill <span className="sz-accent">Hub</span></h1>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Verified Environment for <strong>{targetRole}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* Reset button (FEATURE #1) */}
                    <button
                        onClick={handleReset}
                        title="Change Role"
                        style={{
                            padding: '0.45rem 0.85rem', background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
                            color: '#f87171', fontSize: '0.75rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <RotateCcw size={13} /> Reset
                    </button>
                    {['hub', 'history'].map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            style={{
                                padding: '0.5rem 1rem', background: activeTab === t ? 'rgba(59,130,246,0.1)' : 'transparent',
                                border: '1px solid', borderColor: activeTab === t ? 'rgba(59,130,246,0.3)' : 'transparent',
                                borderRadius: '8px', color: activeTab === t ? '#3b82f6' : '#64748b',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            {t.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'hub' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

                    {/* ── Hire Score Card (shown after Final Exam) ───────── */}
                    {finalExamCompleted && hireScore !== null && hireScore !== undefined ? (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.1) 100%)',
                            border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px',
                            padding: '2rem', marginBottom: '2rem', textAlign: 'center',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'radial-gradient(circle at 50% -30%, rgba(16,185,129,0.15), transparent 70%)'
                            }} />
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <Trophy size={36} color="#10b981" style={{ marginBottom: '0.75rem' }} />
                                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                                    Your Master Hire Score
                                </h2>
                                <div style={{ fontSize: '4rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>
                                    {hireScore}%
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                                    Combined from Resume ({profile.resumeScore || 0}%) + Skills ({profile.skillScore || 0}%) + Test ({profile.testScore || 0}%)
                                </p>
                            </div>
                        </div>
                    ) : finalExamCompleted && (
                        <div style={{
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px',
                            padding: '2rem', marginBottom: '2rem', textAlign: 'center',
                        }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                                Master Hire Score Unlocked!
                            </h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                You have successfully completed the rigorous testing phase. We now need your Resume to generate your final Master Hire Score.
                            </p>
                            <button
                                onClick={() => setShowResumeModal(true)}
                                className="sz-btn-primary sz-btn-start"
                                style={{ padding: '0.8rem 2rem' }}
                            >
                                <Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                Generate Master Hire Score
                            </button>
                        </div>
                    )}

                    {/* ── Test Journey Roadmap (FEATURE #2) ────────────── */}
                    <h3 style={{
                        fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem',
                        marginBottom: '1.5rem', color: '#fff'
                    }}>
                        <Target size={18} color="#3b82f6" /> Skill Verification Journey
                    </h3>

                    {loadingSkills ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <div className="sz-spinner" style={{ margin: '0 auto', width: 32, height: 32 }} />
                            <p style={{ color: '#64748b', marginTop: '1rem', fontSize: '0.85rem' }}>Loading your personalized journey...</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Skill sub-tests as journey milestones */}
                            {recommendedSkills.map((s, idx) =>
                                renderJourneyMilestone(s.name, s.icon, s.importance, idx, 30, false)
                            )}

                            {/* Final Exam Milestone */}
                            <div className="sz-journey-milestone" style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                {/* Milestone dot */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                    background: finalExamCompleted ? 'rgba(16,185,129,0.1)' : finalExamUnlocked ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.02)',
                                    border: `2px solid ${finalExamCompleted ? 'rgba(16,185,129,0.3)' : finalExamUnlocked ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.3s', zIndex: 2,
                                    boxShadow: finalExamUnlocked && !finalExamCompleted ? '0 0 20px rgba(99,102,241,0.3)' : 'none'
                                }}>
                                    {finalExamCompleted ? <CheckCircle2 size={18} color="#10b981" /> :
                                        finalExamUnlocked ? <Shield size={16} color="#818cf8" /> :
                                            <Lock size={14} color="#475569" />}
                                </div>

                                {/* Final Exam card */}
                                <div style={{
                                    flex: 1,
                                    background: finalExamCompleted
                                        ? 'rgba(16,185,129,0.06)'
                                        : finalExamUnlocked
                                            ? 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)'
                                            : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${finalExamCompleted ? 'rgba(16,185,129,0.2)' : finalExamUnlocked ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '20px', padding: '1.5rem 2rem',
                                    opacity: finalExamUnlocked || finalExamCompleted ? 1 : 0.45,
                                    transition: 'all 0.3s'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div className="sz-hero-badge" style={{ marginBottom: '0.75rem' }}>
                                                <Shield size={12} /> {finalExamCompleted ? 'Completed' : 'Proctored Final'}
                                            </div>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: finalExamUnlocked || finalExamCompleted ? '#fff' : '#475569', marginBottom: '0.5rem' }}>
                                                Comprehensive {targetRole} Test
                                            </h2>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '500px' }}>
                                                {finalExamUnlocked || finalExamCompleted
                                                    ? 'The definitive 45-question assessment to calculate your Master Hire Score.'
                                                    : `Complete ${2 - completedSkillTestCount} more skill test${2 - completedSkillTestCount > 1 ? 's' : ''} to unlock.`
                                                }
                                            </p>
                                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Shield size={14} /> Full Security Lock
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Sparkles size={14} /> 45 Questions
                                                </span>
                                            </div>
                                        </div>
                                        {finalExamUnlocked && !finalExamCompleted && (
                                            <button className="sz-btn-primary sz-btn-start" onClick={() => startExam('Main Role Test', 45)}>
                                                Start Final Exam
                                            </button>
                                        )}
                                        {finalExamCompleted && (
                                            <div style={{
                                                padding: '0.5rem 1.2rem', background: 'rgba(16,185,129,0.1)',
                                                border: '1px solid rgba(16,185,129,0.25)', borderRadius: '10px',
                                                fontSize: '0.85rem', fontWeight: 700, color: '#10b981'
                                            }}>
                                                ✓ Complete
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* History Tab */
                history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {history.map((h: any, idx: number) => (
                            <div key={idx} style={{
                                background: 'rgba(20,27,43,0.6)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '12px', padding: '1.25rem 1.5rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>{h.domain}</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{h.score}</div>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: h.status === 'SHORTLISTED' ? '#a855f7' : h.status === 'PASS' ? '#10b981' : '#ef4444'
                                    }}>
                                        {h.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Archive size={40} color="#64748b" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Previous Records</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Complete a verification test to see your history and AI feedback here.</p>
                    </div>
                )
            )}
        </div>
    );

    return (
        <div className="sz-root">
            <ParticleCanvas />
            <div className="sz-glow sz-glow1" />
            <div className="sz-glow sz-glow2" />
            <CandidateHeader activePage="skill-zone" onNavigate={onNavigate} />

            <div className="sz-content">
                <div className="sz-steps-indicator">
                    {[1, 2].map(s => (
                        <div key={s} className="sz-step-item">
                            <div className={`sz-step-dot ${step === 'role' && s === 1 ? 'active' : step === 'hub' ? 'done' : ''}`}>
                                {step === 'hub' ? '✓' : s}
                            </div>
                            <span className={`sz-step-label ${(s === 1 && step === 'role') || (s === 2 && step === 'hub') ? 'active' : ''}`}>
                                {s === 1 ? 'Role' : 'Hub'}
                            </span>
                            {s < 2 && <div className="sz-step-line" />}
                        </div>
                    ))}
                </div>

                {step === 'role' && renderRoleStep()}
                {step === 'hub' && renderHub()}
            </div>
            
            {showResumeModal && (
                <ResumeUploadModal 
                    targetRole={targetRole}
                    onClose={() => setShowResumeModal(false)}
                    onComplete={() => {
                        setShowResumeModal(false);
                        // Force a re-render by updating dummy state or relying on profile refretch
                        // The profile fetch happens on component mount usually, we can update local targetRole temporarily to trigger a re-render
                        // or we can just reload the page for a clean refresh. Reloading ensures header + profile all sync perfectly.
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default SkillZone;
