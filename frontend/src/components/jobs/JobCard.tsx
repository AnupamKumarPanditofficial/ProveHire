import React from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';
import { MapPin, Clock } from 'lucide-react';
import type { Job } from '../../services/recruiterApi';
import './JobCard.css';

const DEPT_ICONS: Record<string, string> = {
    Engineering: '💻',
    Design: '🎨',
    'Data Science': '📊',
    Marketing: '📣',
    Product: '🧩',
    HR: '🤝',
    Finance: '💰',
    Operations: '⚙️',
};

const BAR_COLORS = ['#4f8ef7', '#7c5cf6', '#22b866', '#f59e0b', '#f75f7c', '#06b6d4'];

interface JobCardProps {
    job: Job;
    onViewDetails?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onViewDetails }) => {
    const icon = DEPT_ICONS[job.department] ?? '📋';
    const statusClass = job.status.toLowerCase();

    const daysSincePosted = job.postedAt
        ? Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86_400_000)
        : null;

    // Mini bar chart data from dailyChart
    const chartData = job.dailyChart ?? [];

    return (
        <div className="job-card">
            <div className="job-card-header">
                <div className="job-dept-icon">{icon}</div>
                <span className={`job-status-badge ${statusClass}`}>{job.status}</span>
            </div>

            <div>
                <p className="job-card-title">{job.title}</p>
                <div className="job-card-meta">
                    <span><MapPin size={11} /> {job.location}</span>
                    {daysSincePosted !== null && (
                        <span><Clock size={11} /> Posted {daysSincePosted}d ago</span>
                    )}
                </div>
            </div>

            <div className="job-applicants-row">
                <div>
                    <div className="job-applicants-label">Total Applicants</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span className="job-applicants-value">
                            {job.totalApplicants.toLocaleString()}
                        </span>
                    </div>
                </div>
                {chartData.length > 0 && (
                    <ResponsiveContainer width={80} height={40}>
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                                {chartData.map((_, i) => (
                                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} opacity={0.85} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <button className="job-card-btn" onClick={() => onViewDetails?.(job)}>
                View Details
            </button>
        </div>
    );
};

export default JobCard;
