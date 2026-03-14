

import { useEffect, useState } from 'react';
import { Globe, Calendar, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import './Workspaces.css';
import { getPublicEvents } from '../../services/recruiterApi';

const EventsWorkspace = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await getPublicEvents();
                setEvents(data);
            } catch (err) {
                console.error('Failed to fetch events');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="workspace-container">
                <div className="workspace-header">
                    <Globe className="header-icon" />
                    <div>
                        <h2 className="workspace-title">Tech Events & Blogs</h2>
                        <p className="workspace-subtitle">Loading events...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="workspace-container">
            <div className="workspace-header">
                <div className="header-left">
                    <Globe className="header-icon" />
                    <div>
                        <h2 className="workspace-title">Tech Events & Blogs</h2>
                        <p className="workspace-subtitle">Stay updated with the latest in tech & recruitment</p>
                    </div>
                </div>
                <div className="header-badge">
                    <Sparkles size={14} />
                    <span>Real-time Updates</span>
                </div>
            </div>

            <div className="events-grid">
                {events.length === 0 ? (
                    <div className="no-events">
                        <Calendar size={48} />
                        <h3>No events scheduled yet</h3>
                        <p>Check back later for upcoming tech conferences and webinars.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event._id || event.id} className="event-card">
                            <div className="event-image" style={{ backgroundImage: `url(${event.imageUrl})` }}>
                                <span className="event-category">{event.category}</span>
                            </div>
                            <div className="event-details">
                                <h3 className="event-heading">{event.heading}</h3>
                                <p className="event-description">{event.subtitle}</p>
                                <div className="event-meta">
                                    <div className="meta-item">
                                        <Calendar size={14} />
                                        <span>{event.deadline}</span>
                                    </div>
                                    <div className="meta-item">
                                        <MapPin size={14} />
                                        <span>Global / Online</span>
                                    </div>
                                </div>
                                <button className="view-event-btn" onClick={() => window.open(event.link, '_blank')}>
                                    Register Now <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EventsWorkspace;
