import { useState, useEffect, useCallback } from 'react';
import {
    Flame, Star, Send, CalendarDays, ChevronRight,
    X, Shield, Code2, AlertTriangle, RefreshCw, CheckCircle2,
    Inbox
} from 'lucide-react';
import { API_BASE_URL } from '../globalConfig';
import CandidateHeader from '../components/CandidateHeader';
import './Dashboard.css';

interface DashboardData {
    user: {
        name: string;
        email: string;
        avatar?: string;
        subscriptionPlan: string;
        createdAt?: string;
    };
    stats: {
        applied: number;
        skillTests: number;
        events: number;
        hireScore: number;
    };
    scores: {
        hireScore: number;
        hireScoreExists: boolean;
        assessments: Array<{
            name: string;
            score: number;
            date: string;
        }>;
    };
    pipeline: Array<{
        company: string;
        logo: string;
        role: string;
        status: 'applied' | 'screening' | 'interview' | 'offer';
        date: string;
    }>;
    events: Array<{
        id: string;
        title: string;
        type: string;
        date: string;
        time: string;
    }>;
}

const Dashboard = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`${API_BASE_URL}/api/candidate/dashboard`);
            if (!res.ok) throw new Error('fetch failed');
            const raw = await res.json();

            // Map backend response shape to DashboardData interface
            const json: DashboardData = {
                user: {
                    name: raw.user?.name || raw.scores?.userName || 'User',
                    email: raw.user?.email || '',
                    avatar: raw.user?.avatar,
                    subscriptionPlan: raw.currentPlan || raw.user?.subscriptionPlan || 'Free',
                    createdAt: raw.user?.createdAt,
                },
                stats: {
                    applied: raw.applications?.applied ?? raw.stats?.applied ?? 0,
                    skillTests: raw.verifiedSkills?.length ?? raw.assessmentHistoryCount ?? raw.stats?.skillTests ?? 0,
                    events: raw.events?.length ?? raw.stats?.events ?? 0,
                    hireScore: raw.scores?.hireScore ?? raw.stats?.hireScore ?? 0,
                },
                scores: {
                    hireScore: raw.scores?.hireScore ?? 0,
                    hireScoreExists: raw.scores?.hireScoreExists ?? false,
                    assessments: raw.scores?.assessments ?? raw.verifiedSkills?.map((s: any) => ({
                        name: s.name || s.skillName || 'Skill',
                        score: s.score ?? 0,
                        date: s.verifiedAt || '',
                    })) ?? [],
                },
                pipeline: raw.pipeline ?? [],
                events: (raw.events ?? []).map((ev: any) => ({
                    id: ev.id || ev._id || '',
                    title: ev.title || '',
                    type: ev.type || '',
                    date: ev.date ? new Date(ev.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '',
                    time: ev.time || '',
                })),
            };

            setData(json);
            // If new user, show welcome
            if (json.stats.skillTests === 0) {
                setShowWelcome(true);
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleSelectPlan = async (planName: string) => {
        try {
            setLoading(true);
            // Pricing values for Dashboard Upgrade
            const getAmount = (p: string) => {
                if (p === 'Elite') return 250;
                if (p === 'Pro') return 150;
                return 100; // Basic
            };

            const token = localStorage.getItem('PROVAHIRE_ACCESS_TOKEN') || localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planName: planName,
                    priceAmount: getAmount(planName)
                })
            });

            const paymentData = await response.json();
            if (paymentData.url) {
                window.location.href = paymentData.url; // Redirect to Stripe Checkout
            } else {
                throw new Error(paymentData.message || 'Failed to create payment session');
            }
        } catch (e: any) {
            console.error('Payment Error:', e);
            alert(e.message || 'Payment service is currently unavailable. Please try again later.');
            setLoading(false);
        }
    };

    // Calculate dynamic streak based on account creation date
    const calculateStreak = () => {
        if (!data?.user?.createdAt) return 1;
        const createdDate = new Date(data.user.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - createdDate.getTime());
        const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        return diffDays;
    };

    if (loading) return (
        <div className="db-loader">
            <RefreshCw size={48} className="db-spinner" />
            <p>Gathering your career metrics...</p>
        </div>
    );

    if (error || !data) return (
        <div className="db-error">
            <AlertTriangle size={64} />
            <h2>Oops! Systems offline</h2>
            <p>We couldn't reach the command center. Check your connection.</p>
            <button onClick={fetchDashboardData}>Try Again</button>
        </div>
    );

    return (
        <div className="db-root">
            <CandidateHeader activePage="dashboard" onNavigate={onNavigate} />

            <main className="db-content slide-in">
                {/* Hero Header */}
                <section className="db-hero">
                    <div className="db-hero-left">
                        <span className="db-welcome-tag">Welcome Back, {data.user.name.split(' ')[0]}</span>
                        <h1 className="db-hero-title">Your Career <span className="db-accent">Command Center</span></h1>
                    </div>
                    <div className="db-hire-meter">
                        <div className="db-meter-svg">
                            <svg viewBox="0 0 36 36">
                                <path className="db-meter-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="db-meter-val" strokeDasharray={`${data.scores.hireScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="db-meter-text">
                                <span className="db-meter-num">{data.scores.hireScore}</span>
                                <span className="db-meter-lbl">Hire Score</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="db-grid">
                    {/* Stats Overview */}
                    <div className="db-stats-panel">
                        <div className="db-stat-card">
                            <div className="db-sc-icon ic1"><Send size={20} /></div>
                            <div className="db-sc-val">{data.stats.applied}</div>
                            <div className="db-sc-lbl">Jobs Applied</div>
                        </div>
                        <div className="db-stat-card">
                            <div className="db-sc-icon ic2"><Star size={20} /></div>
                            <div className="db-sc-val">{data.stats.skillTests}</div>
                            <div className="db-sc-lbl">Skills Verified</div>
                        </div>
                        <div className="db-stat-card">
                            <div className="db-sc-icon ic3"><CalendarDays size={20} /></div>
                            <div className="db-sc-val">{data.stats.events}</div>
                            <div className="db-sc-lbl">Events Attended</div>
                        </div>
                        <div className="db-stat-card streak-card">
                            <div className="db-sc-icon ic4"><Flame size={20} /></div>
                            <div className="db-sc-val">{calculateStreak()}</div>
                            <div className="db-sc-lbl">Day Streak</div>
                        </div>
                    </div>

                    {/* Left Column: Pipeline */}
                    <div className="db-col-left">
                        <section className="db-panel db-pipeline">
                            <div className="db-panel-head">
                                <h3>Application Pipeline</h3>
                                <button className="db-btn-text" onClick={() => onNavigate('find-jobs')}>View All <ChevronRight size={14} /></button>
                            </div>
                            <div className="db-pipeline-list">
                                {data.pipeline.length === 0 ? (
                                    <div className="db-empty">
                                        <Inbox size={32} />
                                        <p>No active applications. Ready to start?</p>
                                        <button className="db-btn-mini" onClick={() => onNavigate('find-jobs')}>Find Jobs</button>
                                    </div>
                                ) : (
                                    data.pipeline.map((item, i) => (
                                        <div key={i} className="db-pipe-item">
                                            <div className="db-pipe-logo">{item.logo}</div>
                                            <div className="db-pipe-info">
                                                <h4>{item.role}</h4>
                                                <p>{item.company}</p>
                                            </div>
                                            <div className={`db-pipe-status st-${item.status}`}>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="db-panel db-skills">
                            <div className="db-panel-head">
                                <h3>Skill Breakdown</h3>
                                <button className="db-btn-text" onClick={() => onNavigate('skill-zone')}>Skill Zone <ChevronRight size={14} /></button>
                            </div>
                            <div className="db-skills-content">
                                {data.scores.assessments.length === 0 ? (
                                    <div className="db-ct-box">
                                        <Shield size={24} />
                                        <h4>Unverified Profile</h4>
                                        <p>Complete your first technical assessment to build your Hire Score.</p>
                                        <button className="db-btn-primary" onClick={() => onNavigate('skill-zone')}>Start Assessment</button>
                                    </div>
                                ) : (
                                    <div className="db-scores-list">
                                        {data.scores.assessments.map((s, i) => (
                                            <div key={i} className="db-score-row">
                                                <span className="db-sr-name">{s.name}</span>
                                                <div className="db-sr-bar-wrap">
                                                    <div className="db-sr-bar" style={{ width: `${s.score}%` }} />
                                                </div>
                                                <span className="db-sr-val">{s.score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Events & Subscription */}
                    <div className="db-col-right">
                        <section className="db-panel db-events">
                            <div className="db-panel-head">
                                <h3>Upcoming for You</h3>
                                <button className="db-btn-text" onClick={() => onNavigate('events')}>Calendar <ChevronRight size={14} /></button>
                            </div>
                            <div className="db-events-list">
                                {data.events.length === 0 ? (
                                    <div className="db-empty-mini">No events soon</div>
                                ) : (
                                    data.events.map((ev, i) => (
                                        <div key={i} className="db-event-item">
                                            <div className="db-ei-date">
                                                <span className="db-ed-num">{ev.date.split(' ')[0]}</span>
                                                <span className="db-ed-mo">{ev.date.split(' ')[1]}</span>
                                            </div>
                                            <div className="db-ei-info">
                                                <h4>{ev.title}</h4>
                                                <p>{ev.time}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className={`db-panel db-plan-card p-${data.user.subscriptionPlan.toLowerCase()}`}>
                            <div className="db-plan-glow" />
                            <div className="db-plan-content">
                                <Star className="db-plan-icon" />
                                <div className="db-plan-info">
                                    <span className="db-plan-lbl">Current Plan</span>
                                    <h3 className="db-plan-name">{data.user.subscriptionPlan}</h3>
                                </div>
                                <button className="db-plan-btn" onClick={() => setShowUpgrade(true)}>Upgrade</button>
                            </div>
                        </section>

                        {/* Quick Tips */}
                        <div className="db-tips-card">
                            <div className="db-tip-icon"><Code2 size={24} /></div>
                            <h4>Resume Analysis</h4>
                            <p>Our AI suggests your React skills match 85% of current frontend roles.</p>
                            <button className="db-tip-link" onClick={() => onNavigate('profile')}>Improve Profile →</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal: Welcome New User */}
            {showWelcome && (
                <div className="db-modal-overlay bounce-in">
                    <div className="db-welcome-modal">
                        <div className="db-wm-graphic">🚀</div>
                        <h2>Ready to Get Hired?</h2>
                        <p>Welcome to ProvaHire! To start applying for jobs, you need to verify your skills and get a <b>Hire Score</b>.</p>
                        <div className="db-wm-features">
                            <div className="db-wmf-item"><Shield size={16} /> Technical Verification</div>
                            <div className="db-wmf-item"><Code2 size={16} /> AI Resume Polishing</div>
                            <div className="db-wmf-item"><CheckCircle2 size={16} /> Direct Access to Recruiter</div>
                        </div>
                        <button className="db-btn-primary full" onClick={() => onNavigate('skill-zone')}>Enter Skill Zone</button>
                        <button className="db-btn-text" onClick={() => setShowWelcome(false)}>Explore Dashboard First</button>
                    </div>
                </div>
            )}

            {/* Modal: Upgrade Plan (Mock) */}
            {showUpgrade && (
                <div className="db-modal-overlay">
                    <div className="db-upgrade-modal slide-up">
                        <button className="db-close-btn" onClick={() => setShowUpgrade(false)}><X size={24} /></button>
                        <h2 className="db-ug-title">Choose Your <span className="db-accent">Growth Plan</span></h2>
                        <div className="db-ug-grid">
                            {['Basic', 'Pro', 'Elite'].map(plan => (
                                <div key={plan} className={`db-ug-card ${plan === data.user.subscriptionPlan ? 'current' : ''}`}>
                                    <h4>{plan}</h4>
                                    <ul>
                                        <li>{plan === 'Elite' ? 'Unlimited' : plan === 'Pro' ? '50' : '10'} Job Applications</li>
                                        <li>AI Resume Analysis</li>
                                        <li>Direct Chat Access</li>
                                    </ul>
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={plan === data.user.subscriptionPlan}
                                    >
                                        {plan === data.user.subscriptionPlan ? 'Current Plan' : 'Select'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
