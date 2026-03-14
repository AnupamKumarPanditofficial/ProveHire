import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../globalConfig';
import {
    UserPlus, MessageCircle, MapPin, Search,
    CheckCircle2, MoreVertical, Paperclip, Send,
    RefreshCw
} from 'lucide-react';
import CandidateHeader from '../components/CandidateHeader';
import FilterDropdown from '../components/FilterDropdown';
import './ConnectRecruiter.css';

// ── Types ─────────────────────────────────────────────────────
interface Recruiter {
    id: string | number;
    name: string;
    title: string;
    company: string;
    location: string;
    match: number;
    matchColor: string;
    hiringFor: string[];
    tagColors: string[];
    connected: boolean;
    online: boolean;
    avatar: string; // initials
    avatarGrad: string;
}

interface Message {
    id: string | number;
    from: 'recruiter' | 'user' | 'ai';
    text: string;
    time?: string;
}

// Fake static data removed. We will fetch from backend API.
const ADMIN_KEY = 'Hire123';

const QUICK_REPLIES = ['Suggest times', 'Send resume', 'Ask about remote'];

const FILTER_OPTIONS: Record<string, string[]> = {
    location: ['All', 'San Francisco', 'New York', 'Remote', 'London', 'Berlin'],
    company: ['Tech Giants', 'Startups', 'Mid-size', 'Enterprise', 'FAANG'],
    profile: ['Frontend Dev', 'Backend Dev', 'Full Stack', 'ML Engineer', 'DevOps'],
    exp: ['3-5 Years', 'Fresher', '0-2 Years', '5-8 Years', '8+ Years'],
};

// ── Main Component ─────────────────────────────────────────────
interface Props { onNavigate: (p: string) => void; }

const ConnectRecruiter = ({ onNavigate }: Props) => {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [msgInput, setMsgInput] = useState('');
    const [scanning, setScanning] = useState(true);
    const [scanPct, setScanPct] = useState(0);
    const [filters, setFilters] = useState({ location: 'All', company: 'Tech Giants', exp: '3-5 Years', profile: 'Frontend Dev' });
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selected = selectedId ? recruiters.find(r => r.id === selectedId) : null;
    const currentMsgs = selectedId ? messages[selectedId as string] || [] : [];

    const fetchRecruiters = () => {
        setScanning(true);
        setScanPct(10);
        fetch(`${API_BASE_URL}/users?role=recruiter`, { headers: { 'x-admin-key': ADMIN_KEY } })
            .then(res => res.json())
            .then(data => {
                setScanPct(70);
                setTimeout(() => {
                    const mapped: Recruiter[] = (Array.isArray(data) ? data : []).map((u: any, i: number) => ({
                        id: u._id,
                        name: u.fullName,
                        title: 'Talent Acquisition',
                        company: 'ProvaHire Partner Co.',
                        location: 'Remote',
                        match: Math.max(70, 98 - (i * 4)), // Simulated match score
                        matchColor: i === 0 ? '#10b981' : i === 1 ? '#3b82f6' : '#8b5cf6',
                        hiringFor: ['Any Tech Role'],
                        tagColors: ['#3b82f6'],
                        connected: i === 0,
                        online: i % 2 === 0,
                        avatar: u.fullName.substring(0, 2).toUpperCase(),
                        avatarGrad: i === 0 ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    }));
                    setRecruiters(mapped);
                    if (mapped.length > 0) {
                        setSelectedId(mapped[0].id);
                        // Add an initial greeting from the first recruiter to simulate chat
                        setMessages({
                            [mapped[0].id as string]: [{
                                id: 1,
                                from: 'recruiter',
                                text: `Hi! I'm ${mapped[0].name}. Let's chat about opportunities.`
                            } as Message]
                        });
                    }
                    setScanPct(100);
                    setTimeout(() => setScanning(false), 300);
                }, 800);
            })
            .catch(() => {
                setScanPct(100);
                setScanning(false);
            });
    };

    useEffect(() => {
        fetchRecruiters();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMsgs]);

    const sendMessage = () => {
        if (!msgInput.trim() || !selectedId) return;
        const newMsg: Message = { id: Date.now(), from: 'user', text: msgInput.trim() };
        setMessages(prev => ({ ...prev, [selectedId as string]: [...(prev[selectedId as string] || []), newMsg] }));
        setMsgInput('');

        // Simulate reply
        setTimeout(() => {
            const reply: Message = { id: Date.now() + 1, from: 'recruiter', text: "Thanks for your message! I'm reviewing your profile now." };
            setMessages(prev => ({ ...prev, [selectedId as string]: [...(prev[selectedId as string] || []), reply] }));
        }, 1200);
    };

    const handleConnect = (id: string | number) => {
        setRecruiters(prev => prev.map(r => r.id === id ? { ...r, connected: true } : r));
        setSelectedId(id);
    };

    return (
        <div className="cr-root">
            <CandidateHeader activePage="connect-recruiter" onNavigate={onNavigate} />

            {/* Body — 2 panel layout */}
            <div className="cr-body">

                {/* LEFT PANEL */}
                <div className="cr-left">
                    {/* Header */}
                    <div className="cr-left-header">
                        <div>
                            <h1 className="cr-title">AI-Matched Recruiters</h1>
                            <p className="cr-subtitle">Our neural engine found these recruiters actively hiring for your skillset.</p>
                        </div>
                        <button className="cr-refresh-btn" onClick={() => fetchRecruiters()}>
                            <RefreshCw size={13} className={scanning ? 'spinning' : ''} /> Refresh Matches
                        </button>
                    </div>

                    {/* Filter chips */}
                    <div className="cr-filters">
                        <FilterDropdown
                            label="Location"
                            value={filters.location}
                            options={FILTER_OPTIONS.location}
                            onChange={v => setFilters(p => ({ ...p, location: v }))}
                        />
                        <FilterDropdown
                            label="Company"
                            value={filters.company}
                            options={FILTER_OPTIONS.company}
                            onChange={v => setFilters(p => ({ ...p, company: v }))}
                        />
                        <FilterDropdown
                            label="Profile"
                            value={filters.profile}
                            options={FILTER_OPTIONS.profile}
                            onChange={v => setFilters(p => ({ ...p, profile: v }))}
                            active
                        />
                        <FilterDropdown
                            label="Exp"
                            value={filters.exp}
                            options={FILTER_OPTIONS.exp}
                            onChange={v => setFilters(p => ({ ...p, exp: v }))}
                        />
                    </div>

                    {/* Recruiters Grid */}
                    <div className="cr-recruiter-grid">
                        {recruiters.length === 0 && !scanning ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>
                                <Search size={32} opacity={0.5} style={{ marginBottom: '1rem' }} />
                                <p>No recruiters registered yet.<br />They will appear here once they create accounts.</p>
                            </div>
                        ) : recruiters.slice(0, 3).map(r => (
                            <div key={r.id} className={`cr-recruiter-card ${selectedId === r.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(r.id)}>
                                <div className="cr-match-badge" style={{ background: `${r.matchColor}20`, color: r.matchColor, borderColor: `${r.matchColor}40` }}>
                                    {r.match}% Match
                                </div>
                                <div className="cr-avatar-wrap">
                                    <div className="cr-recruiter-avatar" style={{ background: r.avatarGrad }}>{r.avatar}</div>
                                    {r.online && <span className="cr-online-dot" />}
                                </div>
                                <div className="cr-recruiter-name">
                                    {r.name}
                                    <CheckCircle2 size={14} color="#3b82f6" fill="#3b82f620" />
                                </div>
                                <p className="cr-recruiter-title">
                                    <span className="cr-gradient-text">{r.title} @ {r.company}</span>
                                </p>
                                <p className="cr-recruiter-loc"><MapPin size={11} /> {r.location}</p>
                                <div className="cr-hiring-section">
                                    <p className="cr-hiring-label">HIRING FOR</p>
                                    <div className="cr-hiring-tags">
                                        {r.hiringFor.map((tag, i) => (
                                            <span key={i} className="cr-hiring-tag" style={{ borderColor: `${r.tagColors[i]}50`, color: r.tagColors[i], background: `${r.tagColors[i]}12` }}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="cr-card-actions">
                                    <button className={`cr-connect-btn ${r.connected ? 'connected' : ''}`} onClick={(e) => { e.stopPropagation(); handleConnect(r.id); }}>
                                        <UserPlus size={14} /> {r.connected ? 'Connected' : 'Connect'}
                                    </button>
                                    <button className="cr-msg-btn" onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}>
                                        <MessageCircle size={14} /> Message
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Scanning Loader */}
                    {scanning && (
                        <div className="cr-scanning">
                            <div className="cr-scan-icon">
                                <Search size={22} style={{ opacity: 0.3 }} />
                            </div>
                            <p className="cr-scan-text">Scanning candidates and employers...</p>
                            <div className="cr-scan-bar-bg">
                                <div className="cr-scan-bar-fill" style={{ width: `${scanPct}%`, transition: 'width 0.3s ease' }} />
                            </div>
                        </div>
                    )}

                    {/* More recruiters (below fold) */}
                    {recruiters.slice(3).map(r => (
                        <div key={r.id} className={`cr-recruiter-mini ${selectedId === r.id ? 'selected' : ''}`}
                            onClick={() => setSelectedId(r.id)}>
                            <div className="cr-recruiter-avatar cr-mini-avatar" style={{ background: r.avatarGrad }}>{r.avatar}</div>
                            <div className="cr-mini-info">
                                <p className="cr-mini-name">{r.name} <CheckCircle2 size={12} color="#3b82f6" /></p>
                                <p className="cr-mini-title">{r.title} @ {r.company}</p>
                            </div>
                            <span className="cr-match-badge cr-mini-badge" style={{ background: `${r.matchColor}20`, color: r.matchColor, borderColor: `${r.matchColor}40` }}>
                                {r.match}%
                            </span>
                            <button className="cr-msg-btn cr-mini-btn" onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}>
                                <MessageCircle size={13} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* RIGHT PANEL — Chat */}
                {selected ? (
                    <div className="cr-chat">
                        {/* Chat Header */}
                        <div className="cr-chat-header">
                            <div className="cr-chat-recruiter-avatar" style={{ background: selected.avatarGrad }}>
                                {selected.avatar}
                                {selected.online && <span className="cr-chat-online" />}
                            </div>
                            <div>
                                <p className="cr-chat-name">{selected.name}</p>
                                <p className="cr-chat-status">{selected.online ? 'Online' : 'Offline'}</p>
                            </div>
                            <button className="cr-ib cr-chat-more"><MoreVertical size={16} /></button>
                        </div>

                        {/* Messages */}
                        <div className="cr-messages">
                            {currentMsgs.map(msg => (
                                <div key={msg.id} className={`cr-msg-wrap cr-msg-${msg.from}`}>
                                    {msg.from === 'ai' && (
                                        <div className="cr-ai-bubble">
                                            <span className="cr-ai-label">✦ AI Insight</span>
                                            <p>{msg.text}</p>
                                            {msg.time && <span className="cr-msg-time">{msg.time}</span>}
                                        </div>
                                    )}
                                    {msg.from === 'recruiter' && (
                                        <div className="cr-recruiter-bubble">
                                            <div className="cr-bubble-avatar" style={{ background: selected.avatarGrad }}>{selected.avatar}</div>
                                            <p className="cr-bubble">{msg.text}</p>
                                        </div>
                                    )}
                                    {msg.from === 'user' && (
                                        <div className="cr-user-bubble">
                                            <p className="cr-bubble cr-user-bg">{msg.text}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies */}
                        <div className="cr-quick-replies">
                            {QUICK_REPLIES.map(qr => (
                                <button key={qr} className="cr-qr-chip"
                                    onClick={() => setMsgInput(qr)}>
                                    ✦ {qr}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="cr-input-row">
                            <input
                                className="cr-input"
                                placeholder="Type a message..."
                                value={msgInput}
                                onChange={e => setMsgInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            />
                            <button className="cr-ib"><Paperclip size={15} /></button>
                            <button className="cr-send-btn" onClick={sendMessage}><Send size={15} /></button>
                        </div>
                    </div>
                ) : (
                    <div className="cr-chat" style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', color: '#64748b' }}>
                            <MessageCircle size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
                            <p>No recruiter selected. Select a profile to start a conversation.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConnectRecruiter;
