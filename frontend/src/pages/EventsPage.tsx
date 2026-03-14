import { useState, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight,
    Calendar, Zap, ArrowRight, Globe
} from 'lucide-react';
import CandidateHeader from '../components/CandidateHeader';
import { getEvents, type TechEvent, type EventCategory } from '../utils/eventStore';
import './EventsPage.css';

// ── Types ─────────────────────────────────────────────────────
type TabKey = 'All Events' | EventCategory;

// FEATURED and ALL_EVENTS removed (use eventStore data)

const TABS: TabKey[] = ['All Events', 'Hackathons', 'Webinars', 'Meetups', 'Workshops', 'Other'];

const CAT_COLORS: Record<string, string> = {
    'Hackathons': '#6366f1',
    'Webinars': '#3b82f6',
    'Meetups': '#10b981',
    'Workshops': '#f59e0b',
    'Other': '#8b5cf6'
};

// ── Events Page ───────────────────────────────────────────────
interface EventsPageProps {
    onNavigate: (page: string) => void;
}

const EventsPage = ({ onNavigate }: EventsPageProps) => {
    const [activeTab, setActiveTab] = useState<TabKey>('All Events');
    const [featuredIdx, setFeaturedIdx] = useState(0);
    const [joinedIds, setJoinedIds] = useState<string[]>([]);
    const [events, setEvents] = useState<TechEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<TechEvent | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchEvents = async () => {
            setLoading(true);
            const data = await getEvents();
            setEvents(data);
            setLoading(false);
        };
        fetchEvents();
    }, []);

    const FEATURED = events.slice(0, 5); // top 5
    const visibleFeatured = FEATURED.slice(featuredIdx, featuredIdx + 3);
    const canPrev = featuredIdx > 0;
    const canNext = featuredIdx + 3 < FEATURED.length;

    const filtered = activeTab === 'All Events'
        ? events
        : events.filter(e => e.category === activeTab);

    const toggleJoin = (id: string) => {
        setJoinedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="ep-root">
            <CandidateHeader activePage="events" onNavigate={onNavigate} />

            {/* ── Scrollable Body ───────────────────────────── */}
            <div className="ep-body">

                {/* Hero */}
                <div className="ep-hero">
                    <div>
                        <h1 className="ep-hero-title">
                            Tech Events <span className="ep-hero-accent">Hub</span>
                        </h1>
                        <p className="ep-hero-sub">
                            Connect with global innovators and stay ahead of the curve with<br />
                            AI-curated networking experiences.
                        </p>
                    </div>
                </div>

                {/* Featured Events */}
                <section className="ep-section">
                    <div className="ep-section-hdr">
                        <div className="ep-section-title-row">
                            <div className="ep-section-icon"><Zap size={14} /></div>
                            <h2 className="ep-section-title">Featured Events</h2>
                        </div>
                        <div className="ep-carousel-arrows">
                            <button
                                className={`ep-arrow ${!canPrev ? 'disabled' : ''}`}
                                onClick={() => canPrev && setFeaturedIdx(i => i - 1)}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className={`ep-arrow ${!canNext ? 'disabled' : ''}`}
                                onClick={() => canNext && setFeaturedIdx(i => i + 1)}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {FEATURED.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <Globe size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
                            <p>No featured events scheduled.</p>
                        </div>
                    ) : (
                        <div className="ep-featured-grid">
                            {visibleFeatured.map((ev, i) => {
                                const cColor = CAT_COLORS[ev.category] || '#3b82f6';
                                return (
                                    <div
                                        key={ev._id}
                                        className={`ep-featured-card ${i === 0 ? 'large' : 'small'}`}
                                        style={{ backgroundImage: `url(${ev.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                        onClick={() => setSelectedEvent(ev)}
                                    >
                                        <div className="ep-f-orb ep-f-orb1" style={{ background: cColor }} />
                                        <div className="ep-f-orb ep-f-orb2" style={{ background: cColor }} />
                                        <div className="ep-f-overlay" style={{ background: 'linear-gradient(0deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.6) 50%, rgba(15,23,42,0.2) 100%)' }} />
                                        <div className="ep-f-bottom">
                                            <span className="ep-f-badge" style={{ background: `${cColor}25`, color: cColor, borderColor: `${cColor}50` }}>
                                                {ev.category}
                                            </span>
                                            <h3 className="ep-f-title">{ev.heading}</h3>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Tabs + Event Cards */}
                <section className="ep-section ep-events-section">
                    <div className="ep-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                className={`ep-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="ep-cards-grid">
                        {loading ? (
                            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center' }}>
                                <div className="adm-spinner-lg" style={{ margin: '0 auto' }}></div>
                                <p style={{ marginTop: '1rem', color: '#64748b' }}>Syncing tech events...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                                <p>No events found for this category.</p>
                            </div>
                        ) : (
                            filtered.map(ev => {
                                const cColor = CAT_COLORS[ev.category] || '#3b82f6';
                                return (
                                    <div key={ev._id} className="ep-event-card">
                                        <div className="ep-card-top">
                                            <div className="ep-card-meta">
                                                <Calendar size={11} />
                                                <span>{new Date(ev.deadline).toLocaleDateString()}</span>
                                            </div>
                                            <span
                                                className="ep-card-badge"
                                                style={{ background: `${cColor}20`, color: cColor, borderColor: `${cColor}40` }}
                                            >
                                                {ev.category}
                                            </span>
                                        </div>

                                        <h3 className="ep-card-title">{ev.heading}</h3>
                                        <p className="ep-card-desc">{ev.subtitle}</p>

                                        <div className="ep-card-speakers">
                                            <button onClick={() => setSelectedEvent(ev)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none' }}>
                                                View Event Details →
                                            </button>
                                        </div>

                                        <button
                                            className={`ep-join-btn ${joinedIds.includes(ev._id) ? 'joined' : ''}`}
                                            onClick={() => toggleJoin(ev._id)}
                                        >
                                            {joinedIds.includes(ev._id) ? '✓ REGISTERED' : <><span>REGISTER</span><ArrowRight size={14} /></>}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="ep-footer">
                    <p>© 2024 ProvaHire AI Platforms. All rights reserved.</p>
                    <div className="ep-footer-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Help Center</a>
                    </div>
                </footer>
            </div>

            {/* Modal for Event Details */}
            {selectedEvent && (
                <div className="ep-modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="ep-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="ep-modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
                        {selectedEvent.imageUrl && (
                            <img src={selectedEvent.imageUrl} alt={selectedEvent.heading} className="ep-modal-img" />
                        )}
                        <span className="ep-card-badge" style={{ background: `${CAT_COLORS[selectedEvent.category] || '#3b82f6'}20`, color: CAT_COLORS[selectedEvent.category] || '#3b82f6', borderColor: `${CAT_COLORS[selectedEvent.category] || '#3b82f6'}40` }}>
                            {selectedEvent.category}
                        </span>
                        <h2 className="ep-modal-title">{selectedEvent.heading}</h2>
                        <div className="ep-modal-meta">
                            <Calendar size={14} />
                            <span>Deadline: {new Date(selectedEvent.deadline).toLocaleDateString()}</span>
                        </div>
                        <p className="ep-modal-desc">{selectedEvent.body || selectedEvent.subtitle || 'No detailed description available for this event.'}</p>

                        <div className="ep-modal-actions">
                            <a href={selectedEvent.link} target="_blank" rel="noreferrer" className="ep-register-btn-modal">
                                Register Now <ArrowRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;
