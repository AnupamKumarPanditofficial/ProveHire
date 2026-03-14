import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

const Hero = () => {
    const { isAuthenticated } = useAuth();

    const handleProtectedNavigation = () => {
        if (isAuthenticated) {
            window.location.hash = 'dashboard';
        } else {
            // Save intended route if needed in future, but for now redirect to register
            window.location.hash = '#/#register';
        }
    };

    return (
        <section className="hero">
            <div className="container hero-container">

                <div className="hero-content">
                    <h1 className="hero-title">
                        Hire Smarter<br />
                        with AI<br />
                        Intelligence
                    </h1>

                    <p className="hero-subtitle">
                        Streamline your recruitment process with our advanced AI-powered platform. Automate screening, assess skills, and predict candidate success with 95% accuracy.
                    </p>

                    <div className="hero-cta-group">
                        <button className="cta-btn primary-btn large-btn" onClick={handleProtectedNavigation}>
                            Post a Job <ArrowRight size={18} />
                        </button>
                        <button className="cta-btn secondary-btn large-btn" onClick={handleProtectedNavigation}>
                            Find Jobs
                        </button>
                    </div>

                    <div className="trust-indicator">
                        <div className="avatars">
                            <div className="avatar"></div>
                            <div className="avatar"></div>
                            <div className="avatar"></div>
                            <div className="avatar-count">+2k</div>
                        </div>
                        <span className="trust-text">Trusted by top recruiters</span>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="ai-dashboard-mockup glass-panel">
                        <div className="mockup-header">
                            <div className="window-controls">
                                <span></span><span></span><span></span>
                            </div>
                            <div className="mockup-search-bar"></div>
                            <div className="mockup-icon-btn"><Sparkles size={14} /></div>
                        </div>

                        <div className="mockup-stats-grid">
                            <div className="mockup-stat-card">
                                <div className="stat-header">
                                    <div className="stat-dot success-dot"></div>
                                    Match Score
                                </div>
                                <div className="stat-value">98%</div>
                            </div>
                            <div className="mockup-stat-card">
                                <div className="stat-header">
                                    <div className="stat-dot blue-dot"></div>
                                    Time Saved
                                </div>
                                <div className="stat-value">12h</div>
                            </div>
                        </div>

                        <div className="mockup-list">
                            <div className="mockup-list-item">
                                <div className="item-avatar"></div>
                                <div className="item-lines">
                                    <div className="line line-long"></div>
                                    <div className="line line-short"></div>
                                </div>
                                <div className="item-badge success-badge">Top 1%</div>
                            </div>
                            <div className="mockup-list-item">
                                <div className="item-avatar"></div>
                                <div className="item-lines">
                                    <div className="line line-long"></div>
                                    <div className="line line-short"></div>
                                </div>
                                <div className="item-badge pending-badge">Pending</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
