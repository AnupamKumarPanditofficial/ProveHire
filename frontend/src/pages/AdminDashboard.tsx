import { useEffect, useState, useCallback } from 'react';
import {
    Users, User, Briefcase, Globe,
    Activity, Shield, LogOut, BarChart2, Clock,
    Layers, RefreshCcw, Inbox, Mail, Reply, Filter,
    Eye, EyeOff, Trash2, AlertCircle
} from 'lucide-react';
import './AdminDashboard.css';
import type { ContactMessage } from '../components/ContactSection';
import type { TechEvent, EventCategory } from '../utils/eventStore';
import { addNotification } from '../utils/notificationStore';

const MESSAGES_KEY = 'PROVAHIRE_MESSAGES';
const ADMIN_KEY = 'Hire123';
import { API_BASE_URL } from '../globalConfig';
const API_BASE = `${API_BASE_URL}/api/admin`;

// ── Auth guard ─────────────────────────────────────────────────
const isAdmin = () => sessionStorage.getItem('PROVAHIRE_ADMIN') === 'true';

// ── Types ──────────────────────────────────────────────────────
interface UserRecord {
    _id: string;
    fullName: string;
    email: string;
    role: 'candidate' | 'recruiter';
    isBlocked?: boolean;
    isVerified?: boolean;
    createdAt: string;
}

interface AdminStats {
    totalUsers: number;
    candidates: number;
    recruiters: number;
    recentUsers: UserRecord[];
}

// ── Animated counter ───────────────────────────────────────────
function useCounter(target: number, duration = 1200) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (target === 0) { setVal(0); return; }
        let start = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            start += step;
            if (start >= target) { setVal(target); clearInterval(t); }
            else setVal(Math.floor(start));
        }, 16);
        return () => clearInterval(t);
    }, [target, duration]);
    return val;
}

// ── Stat card ──────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub }:
    { icon: React.ElementType; label: string; value: number; color: string; sub: string }) => {
    const count = useCounter(value);
    return (
        <div className="adm-stat-card" style={{ '--card-color': color } as React.CSSProperties}>
            <div className="adm-stat-icon"><Icon size={22} /></div>
            <div className="adm-stat-body">
                <p className="adm-stat-num">{count.toLocaleString()}</p>
                <p className="adm-stat-label">{label}</p>
                <p className="adm-stat-sub">{sub}</p>
            </div>
            <div className="adm-stat-glow" />
        </div>
    );
};

// ── Relative time helper ───────────────────────────────────────
function timeAgo(iso: string) {
    if (!iso) return '—';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Main ───────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [time, setTime] = useState(new Date());
    const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, candidates: 0, recruiters: 0, recentUsers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Messages state
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Events state
    const [events, setEvents] = useState<TechEvent[]>([]);
    const [eventForm, setEventForm] = useState({
        heading: '', subtitle: '', imageUrl: '', body: '', link: '', deadline: '', category: 'All Events' as EventCategory
    });
    const [showEventSuccess, setShowEventSuccess] = useState(false);

    // Active tab: 'users' | 'messages' | 'events'
    const [tab, setTab] = useState<'users' | 'messages' | 'events'>('users');

    const loadMessagesAndEvents = async () => {
        const rawMsg = localStorage.getItem(MESSAGES_KEY);
        setMessages(rawMsg ? JSON.parse(rawMsg) : []);

        try {
            const res = await fetch(`${API_BASE}/events`, {
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            if (res.ok) setEvents(await res.json());
        } catch (err) {
            console.error('Failed to fetch events');
        }
    };

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/stats`, {
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
            setError('');
        } catch (err) {
            setError('Could not connect to the backend. Showing empty data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin()) {
            window.location.hash = '#/admin/login';
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            return;
        }
        fetchStats();
        loadMessagesAndEvents();
    }, [fetchStats]);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStats();
        loadMessagesAndEvents();
        setTimeout(() => setRefreshing(false), 600);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('PROVAHIRE_ADMIN');
        window.location.hash = '#home';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    };

    const markRead = (id: string) => {
        setMessages(prev => {
            const updated = prev.map(m => m.id === id ? { ...m, read: true } : m);
            localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const deleteMessage = (id: string) => {
        setDeletingId(id);
        setTimeout(() => {
            setMessages(prev => {
                const updated = prev.filter(m => m.id !== id);
                localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
                return updated;
            });
            setDeletingId(null);
        }, 320); // allow exit animation
    };

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': ADMIN_KEY
                },
                body: JSON.stringify(eventForm)
            });
            if (res.ok) {
                loadMessagesAndEvents();
                addNotification(`New Tech Event posted: ${eventForm.heading}`);
                setEventForm({ heading: '', subtitle: '', imageUrl: '', body: '', link: '', deadline: '', category: 'Hackathons' });
                setShowEventSuccess(true);
                setTimeout(() => setShowEventSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Failed to save event');
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            const res = await fetch(`${API_BASE}/events/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            if (res.ok) {
                loadMessagesAndEvents();
                addNotification('Tech Event deleted successfully');
            }
        } catch (err) {
            console.error('Failed to delete event');
        }
    };

    // ── User Management Actions ───────────────────────────
    const handleToggleBlock = async (id: string, role: string) => {
        setActionLoadingId(id);
        try {
            const res = await fetch(`${API_BASE}/users/${id}/block?role=${role}`, {
                method: 'PATCH',
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            if (res.ok) fetchStats();
        } catch (err) {
            console.error('Failed to toggle block');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteUser = async (id: string, role: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${role}? This action cannot be undone.`)) return;
        setActionLoadingId(id);
        try {
            const res = await fetch(`${API_BASE}/users/${id}?role=${role}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': ADMIN_KEY }
            });
            if (res.ok) fetchStats();
        } catch (err) {
            console.error('Failed to delete user');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Filtered messages
    const filteredMessages = messages.filter(m => {
        const d = new Date(m.date);
        if (filterMonth !== 'all' && d.getMonth() !== parseInt(filterMonth)) return false;
        if (filterDate) {
            const picked = new Date(filterDate);
            if (d.getFullYear() !== picked.getFullYear() ||
                d.getMonth() !== picked.getMonth() ||
                d.getDate() !== picked.getDate()) return false;
        }
        return true;
    });

    const unread = messages.filter(m => !m.read).length;
    const candidatePct = stats.totalUsers > 0 ? (stats.candidates / stats.totalUsers * 100).toFixed(0) : '0';
    const recruiterPct = stats.totalUsers > 0 ? (stats.recruiters / stats.totalUsers * 100).toFixed(0) : '0';

    return (
        <div className="adm-root">
            <div className="adm-blob adm-b1" /><div className="adm-blob adm-b2" /><div className="adm-blob adm-b3" />

            {/* ── Header ─────────────────────────────────────── */}
            <header className="adm-header">
                <div className="adm-header-logo">
                    <div className="adm-hl-icon"><Layers size={18} /></div>
                    <span className="adm-hl-text">ProvaHire</span>
                    <span className="adm-hl-badge"><Shield size={10} /> ADMIN</span>
                </div>
                <div className="adm-header-center">
                    <Activity size={14} className="adm-pulse-icon" />
                    <span>Control Center</span>
                </div>
                <div className="adm-header-right">
                    <div className="adm-time"><Clock size={13} />{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    <button className={`adm-refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} title="Refresh">
                        <RefreshCcw size={14} />
                    </button>
                    <button className="adm-logout-btn" onClick={handleLogout}><LogOut size={14} /> Logout</button>
                </div>
            </header>

            <div className="adm-body">
                <div className="adm-page-title">
                    <h1>Platform Overview</h1>
                    <p>Live data from ProvaHire database</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="adm-error-banner">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}

                {/* ── Stat Cards ─────────────────────────────── */}
                <div className="adm-stats-grid">
                    <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="#3b82f6" sub="All accounts" />
                    <StatCard icon={User} label="Candidates" value={stats.candidates} color="#8b5cf6" sub="Total job seekers" />
                    <StatCard icon={Briefcase} label="Recruiters" value={stats.recruiters} color="#10b981" sub="Total employers" />
                    <StatCard icon={Globe} label="Messages" value={messages.length} color="#f59e0b" sub={`${unread} unread`} />
                </div>

                {/* ── Tab Switcher ────────────────────────────── */}
                <div className="adm-tabs">
                    <button className={`adm-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                        <Users size={14} /> Registered Users
                    </button>
                    <button className={`adm-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>
                        <Inbox size={14} /> User Messages {unread > 0 && <span className="adm-tab-badge">{unread}</span>}
                    </button>
                    <button className={`adm-tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
                        <Globe size={14} /> Tech Events
                    </button>
                </div>

                {/* ── Users Tab ──────────────────────────────── */}
                {tab === 'users' && (
                    <div className="adm-panel adm-users-panel">
                        <div className="adm-panel-header">
                            <div className="adm-panel-title-row">
                                <BarChart2 size={16} className="adm-panel-icon" />
                                <h2>Recent Registrations</h2>
                            </div>
                            <span className="adm-live-dot"><span className="adm-dot-pulse" />LIVE</span>
                        </div>

                        {loading ? (
                            <div className="adm-loading">
                                <span className="adm-spinner-lg" />
                                <p>Fetching data from database...</p>
                            </div>
                        ) : stats.recentUsers.length === 0 ? (
                            <div className="adm-no-msgs">
                                <Users size={36} style={{ color: '#1e293b' }} />
                                <p>No users found in the database.</p>
                            </div>
                        ) : (
                            <>
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Verification</th>
                                                <th>Status</th>
                                                <th>Joined</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentUsers.map((u, i) => (
                                                <tr key={u._id}>
                                                    <td style={{ color: '#334155' }}>{i + 1}</td>
                                                    <td style={{ color: '#f1f5f9', fontWeight: 600 }}>{u.fullName}</td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className={`adm-role-chip adm-role-${u.role}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`adm-status-chip ${u.isVerified ? 'adm-status-active' : 'adm-status-blocked'}`} style={{ fontSize: '0.6rem' }}>
                                                            {u.isVerified ? 'VERIFIED' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`adm-status-chip ${u.isBlocked ? 'adm-status-blocked' : 'adm-status-active'}`}>
                                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{timeAgo(u.createdAt)}</td>
                                                    <td>
                                                        <div className="adm-action-group">
                                                            <button
                                                                className={`adm-mini-btn ${u.isBlocked ? 'adm-unblock' : 'adm-block'}`}
                                                                title={u.isBlocked ? 'Unblock user' : 'Block user'}
                                                                onClick={() => handleToggleBlock(u._id, u.role)}
                                                                disabled={actionLoadingId === u._id}
                                                            >
                                                                {u.isBlocked ? <Eye size={13} /> : <EyeOff size={13} />}
                                                            </button>
                                                            <button
                                                                className="adm-mini-btn adm-delete-user"
                                                                title="Delete user"
                                                                onClick={() => handleDeleteUser(u._id, u.role)}
                                                                disabled={actionLoadingId === u._id}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Ratio bar */}
                                <div className="adm-ratio-section">
                                    <p className="adm-ratio-label">Candidate / Recruiter Ratio</p>
                                    <div className="adm-ratio-bar">
                                        <div className="adm-ratio-fill-c" style={{ width: `${candidatePct}%` }}>
                                            <span>{candidatePct}% C</span>
                                        </div>
                                        <div className="adm-ratio-fill-r">
                                            <span>{recruiterPct}% R</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Messages Tab ────────────────────────────── */}
                {tab === 'messages' && (
                    <div className="adm-messages-panel">
                        <div className="adm-panel-header adm-msg-header">
                            <div className="adm-panel-title-row">
                                <Inbox size={16} className="adm-panel-icon" />
                                <h2>User Messages</h2>
                                {unread > 0 && <span className="adm-unread-badge">{unread} unread</span>}
                            </div>
                            <div className="adm-msg-filters">
                                <Filter size={13} style={{ color: '#475569' }} />
                                <select className="adm-filter-sel" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                                    <option value="all">All Months</option>
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                        <option key={m} value={i}>{m}</option>
                                    ))}
                                </select>
                                <input
                                    className="adm-filter-date"
                                    type="date"
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                    title="Filter by specific date"
                                />
                                {(filterMonth !== 'all' || filterDate) && (
                                    <button className="adm-clear-filter" onClick={() => { setFilterMonth('all'); setFilterDate(''); }}>✕ Clear</button>
                                )}
                            </div>
                        </div>

                        {filteredMessages.length === 0 ? (
                            <div className="adm-no-msgs">
                                <Mail size={40} style={{ color: '#1e293b' }} />
                                <p>{messages.length === 0
                                    ? 'No messages yet — they appear once users submit the contact form on the landing page.'
                                    : 'No messages match the selected filters.'}</p>
                            </div>
                        ) : (
                            <div className="adm-msg-grid">
                                {filteredMessages.map(msg => {
                                    const isExpanded = expandedId === msg.id;
                                    const isDeleting = deletingId === msg.id;
                                    const dt = new Date(msg.date);
                                    const timeStr = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                                        ' · ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={msg.id} className={`adm-msg-card ${!msg.read ? 'adm-msg-unread' : ''} ${isDeleting ? 'adm-msg-deleting' : ''}`}>
                                            <div className="adm-msg-top">
                                                <div className="adm-msg-meta">
                                                    <div className="adm-msg-avatar">{msg.email[0].toUpperCase()}</div>
                                                    <div>
                                                        <p className="adm-msg-email">{msg.email}</p>
                                                        <p className="adm-msg-time">{timeStr}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {!msg.read && <span className="adm-new-dot" />}
                                                    <button
                                                        className="adm-delete-btn"
                                                        title="Delete message"
                                                        onClick={() => deleteMessage(msg.id)}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="adm-msg-subject">{msg.subject}</p>
                                            <p className="adm-msg-preview" style={isExpanded ? { WebkitLineClamp: 'unset', opacity: 1 } : {}}>
                                                {msg.message}
                                            </p>
                                            <div className="adm-msg-actions">
                                                <button
                                                    className="adm-see-btn"
                                                    onClick={() => { setExpandedId(isExpanded ? null : msg.id); markRead(msg.id); }}
                                                >
                                                    {isExpanded ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> See Message</>}
                                                </button>
                                                <a
                                                    className="adm-reply-btn"
                                                    href={`mailto:${msg.email}?subject=Re%3A%20${encodeURIComponent(msg.subject)}&body=Hi%2C%0A%0AThank%20you%20for%20reaching%20out.%0A%0A---Original%20Message---%0A${encodeURIComponent(msg.message)}`}
                                                    onClick={() => markRead(msg.id)}
                                                >
                                                    <Reply size={13} /> Reply via Email
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Events Tab ──────────────────────────────── */}
                {tab === 'events' && (
                    <div className="adm-panel adm-events-panel">
                        <div className="adm-panel-header">
                            <div className="adm-panel-title-row">
                                <Globe size={16} className="adm-panel-icon" />
                                <h2>Tech Events Management</h2>
                            </div>
                        </div>

                        <div className="adm-events-content">
                            {/* Form */}
                            <form className="adm-event-form" onSubmit={handleEventSubmit}>
                                <h3>Post New Event / Blog</h3>
                                <div className="adm-form-grid">
                                    <div className="adm-form-group">
                                        <label>Heading</label>
                                        <input required value={eventForm.heading} onChange={e => setEventForm({ ...eventForm, heading: e.target.value })} placeholder="e.g. AI Next Summit 2026" />
                                    </div>
                                    <div className="adm-form-group">
                                        <label>Category</label>
                                        <select required value={eventForm.category} onChange={e => setEventForm({ ...eventForm, category: e.target.value as EventCategory })}>
                                            <option value="Hackathons">Hackathons</option>
                                            <option value="Webinars">Webinars</option>
                                            <option value="Meetups">Meetups</option>
                                            <option value="Workshops">Workshops</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="adm-form-group">
                                        <label>Subtitle / Description</label>
                                        <input required value={eventForm.subtitle} onChange={e => setEventForm({ ...eventForm, subtitle: e.target.value })} placeholder="Brief hook..." />
                                    </div>
                                    <div className="adm-form-group">
                                        <label>Deadline / Date</label>
                                        <input required type="date" value={eventForm.deadline} onChange={e => setEventForm({ ...eventForm, deadline: e.target.value })} />
                                    </div>
                                    <div className="adm-form-group adm-col-span-2">
                                        <label>Cover Image URL</label>
                                        <input required type="url" value={eventForm.imageUrl} onChange={e => setEventForm({ ...eventForm, imageUrl: e.target.value })} placeholder="https://..." />
                                    </div>
                                    <div className="adm-form-group adm-col-span-2">
                                        <label>Full Content Text</label>
                                        <textarea required value={eventForm.body} onChange={e => setEventForm({ ...eventForm, body: e.target.value })} rows={4} placeholder="Detailed description..." />
                                    </div>
                                    <div className="adm-form-group adm-col-span-2">
                                        <label>Registration Link</label>
                                        <input required type="url" value={eventForm.link} onChange={e => setEventForm({ ...eventForm, link: e.target.value })} placeholder="https://..." />
                                    </div>
                                </div>
                                <button type="submit" className={`adm-submit-event ${showEventSuccess ? 'success' : ''}`}>
                                    {showEventSuccess ? 'Saved successfully!' : 'Publish Event'}
                                </button>
                            </form>

                            {/* List */}
                            <div className="adm-events-list-section">
                                <h3>Published Events ({events.length})</h3>
                                {events.length === 0 ? (
                                    <div className="adm-no-msgs">
                                        <Globe size={40} style={{ color: '#1e293b' }} />
                                        <p>No events posted yet. Events posted here will appear on the candidate dashboard and events page.</p>
                                    </div>
                                ) : (
                                    <div className="adm-published-list">
                                        {events.map((ev, i) => (
                                            <div key={ev._id} className="adm-published-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                                <div className="adm-pub-img" style={{ backgroundImage: `url(${ev.imageUrl})` }} />
                                                <div className="adm-pub-info">
                                                    <span className="adm-pub-cat">{ev.category}</span>
                                                    <h4>{ev.heading}</h4>
                                                    <p>{ev.subtitle}</p>
                                                    <div className="adm-pub-meta">
                                                        <span>Deadline: {ev.deadline}</span>
                                                    </div>
                                                </div>
                                                <button className="adm-delete-btn" title="Delete event" onClick={() => handleDeleteEvent(ev._id)} style={{ alignSelf: 'flex-start' }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
