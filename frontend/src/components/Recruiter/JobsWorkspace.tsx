import React, { useState } from 'react';
import { Search, Filter, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';

const JobsWorkspace: React.FC = () => {
    const [selectedJobId, setSelectedJobId] = useState<number | null>(1);

    const jobs = [
        { id: 1, title: 'Senior Frontend Developer', status: 'Active', candidates: 12, matchRequired: 85 },
        { id: 2, title: 'Backend Node.js Engineer', status: 'Active', candidates: 8, matchRequired: 80 },
        { id: 3, title: 'Product Designer', status: 'Draft', candidates: 0, matchRequired: 70 },
    ];

    const mockCandidates = [
        { id: 101, name: 'Alice Walker', role: 'Frontend Architect', match: 96, skills: ['React', 'TypeScript', 'System Design'], avatar: 'A' },
        { id: 102, name: 'John Doe', role: 'UI Engineer', match: 89, skills: ['React', 'CSS', 'Figma'], avatar: 'J' },
        { id: 103, name: 'Sarah Connor', role: 'Full Stack Dev', match: 86, skills: ['Node.js', 'React', 'MongoDB'], avatar: 'S' }
    ];

    return (
        <div className="workspace-split-layout">
            {/* Left Pane: Job List */}
            <div className="workspace-list-pane">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Your Jobs</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage postings and matches</p>
                </div>
                <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    {jobs.map(job => (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border)',
                                cursor: 'pointer',
                                background: selectedJobId === job.id ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                borderLeft: selectedJobId === job.id ? '3px solid var(--primary-color)' : '3px solid transparent'
                            }}
                        >
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{job.title}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>{job.status}</span>
                                <span style={{ color: job.candidates > 0 ? '#10b981' : 'inherit' }}>{job.candidates} Matches</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <button style={{ width: '100%', padding: '0.75rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        + Create New Job
                    </button>
                </div>
            </div>

            {/* Right Pane: Detail & AI Candidates */}
            <div className="workspace-detail-pane" style={{ backgroundColor: 'var(--bg-main)' }}>
                {selectedJobId ? (
                    <div style={{ padding: '2rem' }}>
                        {/* Job Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem' }}>{jobs.find(j => j.id === selectedJobId)?.title}</h1>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Showing AI Shortlisted Candidates above {jobs.find(j => j.id === selectedJobId)?.matchRequired}% match</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Filter size={16} /> Filters
                                </button>
                                <button style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Search size={16} /> Search Candidates
                                </button>
                            </div>
                        </div>

                        {/* Candidate Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                            {mockCandidates.map(candidate => (
                                <div key={candidate.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #ec4899)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                                                {candidate.avatar}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {candidate.name} <ShieldCheck size={16} color="#10b981" />
                                                </h3>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{candidate.role}</span>
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                            {candidate.match}% Match
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                        {candidate.skills.map((skill, idx) => (
                                            <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', fontWeight: 600 }}>
                                            <MessageSquare size={16} /> Message
                                        </button>
                                        <button style={{ flex: 1, padding: '8px', background: 'var(--primary-color)', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}>
                                            <ExternalLink size={16} /> View Profile
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '2rem', display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        Select a job to view shortlisted candidates.
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobsWorkspace;
