import { Bell, Layers, Crown } from 'lucide-react';
import { getProfile } from '../utils/profileStore';
import { hasFeature } from '../utils/planUtils';
import './CandidateHeader.css';

export type CandidateActivePage =
    | 'dashboard'
    | 'events'
    | 'find-jobs'
    | 'connect-recruiter'
    | 'skill-zone'
    | 'profile';

interface CandidateHeaderProps {
    activePage: CandidateActivePage;
    onNavigate: (page: string) => void;
}

const NAV_LINKS: { label: string; key: string }[] = [
    { label: 'Home', key: 'dashboard' },
    { label: 'Find Jobs', key: 'find-jobs' },
    { label: 'Events', key: 'events' },
    { label: 'Skill Zone', key: 'skill-zone' },
    { label: 'Connect With Recruiter', key: 'connect-recruiter' },
];

const CandidateHeader = ({ activePage, onNavigate }: CandidateHeaderProps) => {
    const profile = getProfile();
    const initials = profile?.name
        ? profile.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
        : 'U'; // Default fallback

    return (
        <header className="ch-nav">
            {/* Logo */}
            <div className="ch-logo" onClick={() => onNavigate('dashboard')} role="button" tabIndex={0}>
                <div className="ch-logo-icon"><Layers size={17} /></div>
                <span className="ch-logo-text">ProvaHire</span>
                {hasFeature(profile, 'proTag') && (
                    <div className="pro-badge-mini">
                        <Crown size={10} fill="currentColor" /> PRO
                    </div>
                )}
            </div>

            {/* Nav links */}
            <nav className="ch-nav-links">
                {NAV_LINKS.map(({ label, key }) => (
                    <button
                        key={key}
                        className={`ch-nl ${activePage === key ? 'active' : ''}`}
                        onClick={() => onNavigate(key)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            {/* Right actions */}
            <div className="ch-nav-right">
                <button className="ch-ib ch-bell" aria-label="Notifications">
                    <Bell size={15} />
                    <span className="ch-bdot" />
                </button>
                {/* Avatar → navigates to profile */}
                <div
                    className={`ch-avatar ${activePage === 'profile' ? 'active' : ''}`}
                    aria-label="Profile"
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigate('profile')}
                    onKeyDown={(e) => e.key === 'Enter' && onNavigate('profile')}
                    title="View Profile"
                >
                    <span>{initials}</span>
                </div>
            </div>
        </header>
    );
};

export default CandidateHeader;
