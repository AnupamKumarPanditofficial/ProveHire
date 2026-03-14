import React, { useState } from 'react';
import './RecruiterDashboard.css';
import Sidebar from '../components/Recruiter/Sidebar';
import DashboardHome from '../components/Recruiter/DashboardHome';
import JobsWorkspace from '../components/Recruiter/JobsWorkspace';
import MessagesWorkspace from '../components/Recruiter/MessagesWorkspace';
import EventsWorkspace from '../components/Recruiter/EventsWorkspace';
import ProfileWorkspace from '../components/Recruiter/ProfileWorkspace';
import JobListingsPage from './JobListingsPage';
import PostNewJobPage from './PostNewJobPage';

export type WorkspaceType = 'home' | 'jobs' | 'jobs-list' | 'jobs-new' | 'messages' | 'events' | 'profile';

const RecruiterDashboard: React.FC = () => {
    const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>('home');

    const renderWorkspace = () => {
        switch (activeWorkspace) {
            case 'home': return <DashboardHome onNavigate={setActiveWorkspace} />;
            case 'jobs': return <JobsWorkspace />;
            case 'jobs-list': return <JobListingsPage onNavigate={setActiveWorkspace} />;
            case 'jobs-new': return <PostNewJobPage onNavigate={setActiveWorkspace} />;
            case 'messages': return <MessagesWorkspace />;
            case 'events': return <EventsWorkspace />;
            case 'profile': return <ProfileWorkspace />;
            default: return <DashboardHome onNavigate={setActiveWorkspace} />;
        }
    };

    return (
        <div className="recruiter-os">
            {/* Left Sidebar - Persistent Navigation */}
            <div className="recruiter-sidebar-container">
                <Sidebar activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
            </div>

            {/* Main Content Area - Renders the active workspace */}
            <div className="recruiter-main-content">
                {renderWorkspace()}
            </div>
        </div>
    );
};

export default RecruiterDashboard;
