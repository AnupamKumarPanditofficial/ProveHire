import React from 'react';
import { LayoutDashboard, Briefcase, MessageSquare, Calendar, LogOut } from 'lucide-react';
import './RecruiterSidebar.css';
import useFetch from '../../hooks/useFetch';
import { getProfile } from '../../services/recruiterApi';
import type { WorkspaceType } from '../../pages/RecruiterDashboard';

interface SidebarProps {
    activeWorkspace: WorkspaceType;
    setActiveWorkspace: (ws: WorkspaceType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeWorkspace, setActiveWorkspace }) => {
    const { data: profile } = useFetch(getProfile);

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'jobs-list', label: 'Jobs & Candidates', icon: Briefcase },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'events', label: 'Tech Events', icon: Calendar },
    ];

    const handleLogout = () => {
        // Implement logout logic securely; redirecting for now
        window.location.hash = '#/';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    };

    return (
        <div className="recruiter-sidebar">
            <div className="sidebar-header">
                <div className="logo-icon-wrapper">
                    <Briefcase size={22} className="logo-icon-inner" />
                </div>
                <h2>ProvaHire OS</h2>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">MAIN</div>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            className={`nav-btn ${activeWorkspace === item.id ? 'active' : ''}`}
                            onClick={() => setActiveWorkspace(item.id as WorkspaceType)}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div
                    className={`recruiter-profile-mini ${activeWorkspace === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveWorkspace('profile')}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="avatar">
                        {profile?.profilePic ? <img src={profile.profilePic} alt="" /> : (profile?.fullName?.charAt(0) || 'R')}
                    </div>
                    <div className="info">
                        <strong>{profile?.fullName || 'Tech Recruiter'}</strong>
                        <span>{profile?.company || 'Acme Corp'}</span>
                    </div>
                </div>
                <button className="nav-btn logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
