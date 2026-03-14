import { useEffect, useState } from 'react';
import {
    Award, BookOpen, AlertCircle,
    ArrowRight, CheckCircle2, XCircle, TrendingUp, TrendingDown
} from 'lucide-react';
import CandidateHeader from '../../../components/CandidateHeader';
import type { AssessmentResult } from '../../../types/assessment.types';
import { ParticleCanvas } from './ParticleCanvas';
import { saveProfile, getProfile } from '../../../utils/profileStore';

interface Props { onNavigate: (p: string) => void; }

const Result = ({ onNavigate }: Props) => {
    const [result, setResult] = useState<AssessmentResult | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('sz_result');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setResult(parsed);

                // Save to History on first load
                if (!parsed._recorded) {
                    const savedSubject = sessionStorage.getItem('sz_subject') || 'Role Test';
                    const targetRole = sessionStorage.getItem('sz_target_role') || 'Unknown';
                    const qCount = parseInt(sessionStorage.getItem('sz_question_count') || '30');

                    const historyStr = localStorage.getItem('sz_history') || '[]';
                    let history = [];
                    try { history = JSON.parse(historyStr); } catch (e) { }

                    const resScoreStr = sessionStorage.getItem('sz_resume_score');
                    const resScoreObj = resScoreStr ? JSON.parse(resScoreStr) : { total: 0 };
                    const resScoreValue = resScoreObj.total || 0;
                    const testPts = parsed.testScore || 0;

                    // Pass threshold: 70%
                    const percentage = Math.round((testPts / qCount) * 100);
                    let status = percentage >= 70 ? 'PASS' : 'FAIL';
                    if (percentage >= 85 && resScoreValue >= 80) status = 'SHORTLISTED';

                    history.unshift({
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        domain: savedSubject,
                        score: testPts,
                        status
                    });

                    history = history.slice(0, 10);
                    localStorage.setItem('sz_history', JSON.stringify(history));

                    // Persistence to Profile
                    const currentProfile = getProfile();
                    const updates: any = { resumeScore: resScoreValue, targetRole };

                    if (qCount === 45) {
                        // Main Role Test
                        updates.testScore = percentage;
                    } else {
                        // Skill Sub-test
                        const existingVerified = currentProfile.verifiedSkills || [];
                        const idx = existingVerified.findIndex(s => s.name === savedSubject);
                        const newSkill = {
                            id: Date.now(),
                            name: savedSubject,
                            pct: percentage,
                            level: percentage >= 90 ? 'Expert' : percentage >= 75 ? 'Advanced' : percentage >= 60 ? 'Intermediate' : 'Beginner'
                        };

                        if (idx >= 0) {
                            if (percentage > existingVerified[idx].pct) {
                                existingVerified[idx] = newSkill;
                            }
                        } else {
                            existingVerified.push(newSkill);
                        }
                        updates.verifiedSkills = [...existingVerified];

                        // Update skillScore as average of verified skills
                        const avg = Math.round(existingVerified.reduce((acc, s) => acc + s.pct, 0) / existingVerified.length);
                        updates.skillScore = avg;
                    }

                    // We DO NOT calculate HireScore here anymore.
                    // This is deferred until the user clicks "Generate Hire Score" and uploads resume.

                    saveProfile(updates);

                    // Mark as recorded
                    parsed._recorded = true;
                    sessionStorage.setItem('sz_result', JSON.stringify(parsed));
                }
            } catch (e) {
                console.error("Failed to parse result", e);
            }
        } else {
            // Guard: no result implies they shouldn't be here
            onNavigate('skill-zone');
        }
    }, [onNavigate]);

    const [showPaper, setShowPaper] = useState(false);

    if (!result) return null;

    const resumeScoreStr = sessionStorage.getItem('sz_resume_score');
    const resumeScoreObj = resumeScoreStr ? JSON.parse(resumeScoreStr) : { total: 0 };
    const resumeScore = resumeScoreObj.total || 0;

    const testScore = result.testScore || 0;

    let finalStatus = 'FAIL';
    let statusColor = '#ef4444'; // Red

    if (testScore >= 32 && resumeScore > 83) {
        finalStatus = 'SHORTLISTED';
        statusColor = '#a855f7'; // Purple
    } else if (testScore >= 32) {
        finalStatus = 'PASS';
        statusColor = '#10b981'; // Green
    }

    const isFail = finalStatus === 'FAIL';

    const todayStr = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('sz_attempts_date');
    const storedCount = parseInt(localStorage.getItem('sz_attempts_count') || '0');
    const attemptsLeft = (storedDate === todayStr) ? Math.max(0, 3 - storedCount) : 3;

    const paper = (result as any).paperDetails;

    return (
        <div className="sz-root" style={{ background: '#050814' }}>
            <ParticleCanvas />

            {/* Ambient glows tailored to pass/fail */}
            <div className="sz-glow sz-glow1" style={{ background: `radial-gradient(circle, ${statusColor}20, transparent 70%)` }} />
            <div className="sz-glow sz-glow2" style={{ background: `radial-gradient(circle, ${statusColor}10, transparent 70%)` }} />

            <CandidateHeader activePage="skill-zone" onNavigate={onNavigate} />

            <div className="sz-content" style={{ padding: '2rem 1.5rem 4rem' }}>
                <div style={{ maxWidth: 960, width: '100%', animation: 'stepFadeIn 0.5s ease-out' }}>

                    {/* Header Section */}
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            background: `${statusColor}15`, color: statusColor,
                            border: `1px solid ${statusColor}30`, borderRadius: '20px',
                            padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem'
                        }}>
                            {isFail ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                            {isFail ? 'Assessment Failed' : 'Assessment Passed'}
                        </div>
                        <h1 className="sz-title" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                            Assessment <span style={{ color: '#fff' }}>Report</span>
                        </h1>
                        <p className="sz-subtitle" style={{ maxWidth: 'none', fontSize: '1rem', color: '#94a3b8' }}>
                            Final Status evaluation based on technical marks and resume authenticity.
                        </p>
                    </div>

                    {/* Top Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {/* Exam Score Card */}
                        <div style={{ background: 'rgba(20,27,43,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Exam Score</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '4.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{testScore}</span>
                                <span style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: 600 }}>/ 45</span>
                            </div>
                        </div>

                        {/* Resume Score Card */}
                        <div style={{ background: 'rgba(20,27,43,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Resume Score</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '4.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{resumeScore}</span>
                                <span style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: 600 }}>%</span>
                            </div>
                        </div>

                        {/* Final Status Card */}
                        <div style={{ background: 'rgba(20,27,43,0.6)', border: `1px solid ${statusColor}30`, borderRadius: '16px', padding: '2rem', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% -20%, ${statusColor}20, transparent 70%)` }} />
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', position: 'relative' }}>Final Status</span>
                            <div style={{ fontSize: finalStatus === 'SHORTLISTED' ? '3rem' : '4.5rem', fontWeight: 800, color: statusColor, lineHeight: 1, position: 'relative', textShadow: `0 0 20px ${statusColor}40` }}>
                                {finalStatus}
                            </div>
                        </div>
                    </div>

                    {isFail ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px', marginBottom: '2rem' }}>
                            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>You did not meet the required criteria.</h2>
                            <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.95rem' }}>Return to the dashboard to prepare better, or try the assessment again to improve your score.</p>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    className="sz-btn-primary"
                                    onClick={() => onNavigate('skill-zone')}
                                    disabled={attemptsLeft === 0}
                                    style={{ padding: '0.8rem 2rem', opacity: attemptsLeft === 0 ? 0.5 : 1 }}
                                >
                                    Try Again (Attempts Left: {attemptsLeft})
                                </button>
                                <button
                                    className="sz-btn-primary sz-btn-start"
                                    onClick={() => onNavigate('dashboard')}
                                    style={{ padding: '0.8rem 2rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* AI Verdict */}
                            <div style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.05))' }} />
                                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Award size={20} color="#818cf8" /> AstraEval Executive Summary:
                                </h3>
                                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.7', position: 'relative', zIndex: 1 }}>
                                    {result.aiVerdict}
                                </p>
                            </div>

                            {/* Middle Grid: Strengths & Weaknesses */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(20,27,43,0.5)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.05rem', color: '#10b981', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={18} /> Highlighted Strengths
                                    </h3>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {result.strengths.map((s, i) => (
                                            <li key={i} style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <div style={{ marginTop: '3px', color: '#10b981' }}><CheckCircle2 size={14} /></div>
                                                <span style={{ lineHeight: 1.5 }}>{s}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div style={{ background: 'rgba(20,27,43,0.5)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.05rem', color: '#ef4444', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingDown size={18} /> Areas for Improvement
                                    </h3>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                        {result.weaknesses.map((w, i) => (
                                            <li key={i} style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <div style={{ marginTop: '3px', color: '#ef4444' }}><AlertCircle size={14} /></div>
                                                <span style={{ lineHeight: 1.5 }}>{w}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Topic Breakdown */}
                            <div style={{ background: 'rgba(20,27,43,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1.5rem' }}>Topic Breakdown</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {result.topicWise.map((t, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{t.topic}</span>
                                                <span style={{ color: '#94a3b8' }}>{t.correct}/{t.total} ({t.percentage}%)</span>
                                            </div>
                                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${t.percentage}%`, height: '100%',
                                                    background: t.status === 'Strong' ? '#10b981' : t.status === 'Average' ? '#f59e0b' : '#ef4444',
                                                    borderRadius: '3px'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                                <button
                                    className="sz-btn-primary sz-btn-start"
                                    onClick={() => onNavigate('dashboard')}
                                    style={{ padding: '0.8rem 2.5rem' }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Continue to Dashboard <ArrowRight size={18} />
                                    </span>
                                </button>
                            </div>
                        </>
                    )}

                    {/* View Submitted Paper Section */}
                    {paper && paper.questions && (
                        <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowPaper(!showPaper)}
                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                                >
                                    <BookOpen size={16} /> {showPaper ? 'Hide Submitted Paper' : 'View Submitted Paper'}
                                </button>
                            </div>

                            {showPaper && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', animation: 'stepFadeIn 0.3s ease-out' }}>
                                    {paper.questions.map((q: any, idx: number) => {
                                        const selectedIdx = paper.answers[idx];
                                        const isCorrect = selectedIdx === q.correctIndex;

                                        return (
                                            <div key={idx} style={{ background: 'rgba(20,27,43,0.5)', padding: '1.5rem', borderRadius: '12px', borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>Question {idx + 1}</span>
                                                    <span style={{ color: isCorrect ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>{isCorrect ? '+1 Mark' : '0 Marks'}</span>
                                                </div>
                                                <p style={{ color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
                                                    {q.question}
                                                </p>

                                                {q.code && (
                                                    <pre style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.2rem', color: '#60a5fa', fontSize: '0.85rem', overflowX: 'auto' }}>
                                                        <code>{q.code}</code>
                                                    </pre>
                                                )}

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '0.9rem', color: isCorrect ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                        <span style={{ color: '#94a3b8', minWidth: '100px' }}>Your Answer: </span>
                                                        <span style={{ flex: 1 }}>{selectedIdx !== undefined ? q.options[selectedIdx] : 'Unanswered'} {isCorrect ? " ✓" : " ✗"}</span>
                                                    </div>

                                                    {!isCorrect && (
                                                        <div style={{ fontSize: '0.9rem', color: '#4ade80', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ color: '#94a3b8', minWidth: '100px' }}>Correct Answer: </span>
                                                            <span style={{ flex: 1 }}>{q.options[q.correctIndex]}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {q.explanation && (
                                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.05)', borderRadius: '8px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, borderLeft: '2px solid rgba(59,130,246,0.3)' }}>
                                                        <strong style={{ color: '#cbd5e1' }}>Explanation: </strong> {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Result;
