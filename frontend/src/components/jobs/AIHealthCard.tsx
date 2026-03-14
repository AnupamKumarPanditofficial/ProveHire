import React from 'react';
import { Sparkles } from 'lucide-react';
import type { Job } from '../../services/recruiterApi';
import './AIHealthCard.css';

interface AIHealthCardProps {
    jobs: Job[];
}

const DEPT_COLORS: Record<string, string> = {
    Engineering: '#4f8ef7',
    Design: '#f59e0b',
    'Data Science': '#7c5cf6',
    Marketing: '#f75f7c',
    Product: '#22b866',
    HR: '#06b6d4',
};

const AIHealthCard: React.FC<AIHealthCardProps> = ({ jobs }) => {
    // Find the role with most applicants for the insight text
    const topJob = [...jobs].sort((a, b) => b.totalApplicants - a.totalApplicants)[0];
    const totalApplicants = jobs.reduce((acc, j) => acc + j.totalApplicants, 0);
    const totalHired = jobs.reduce((acc, j) => acc + j.pipeline.hired, 0);
    const matchScoreAvg = totalApplicants > 0 ? Math.round((totalHired / totalApplicants) * 1000) : 0;
    const displayScore = Math.min(matchScoreAvg + 72, 99); // Offset for a meaningful avg display

    // Group jobs by department
    const deptMap: Record<string, number> = {};
    jobs.forEach(j => {
        if (!deptMap[j.department]) deptMap[j.department] = 0;
        deptMap[j.department]++;
    });
    const departments = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);
    const maxCount = departments[0]?.[1] ?? 1;

    return (
        <div style={{ display: 'flex', gap: '1rem' }}>
            {/* AI Health */}
            <div className="ai-health-card" style={{ flex: '1.5' }}>
                <div className="ai-health-left">
                    <div className="ai-health-title">
                        <Sparkles size={14} /> AI Hiring Health
                    </div>
                    <p className="ai-health-body">
                        {jobs.length === 0
                            ? 'Post your first job to start tracking hiring health insights.'
                            : topJob
                                ? `Your sourcing efficiency is active across ${jobs.length} open role${jobs.length !== 1 ? 's' : ''}. We recommend focusing on "${topJob.title}" — it has the highest applicant volume this period.`
                                : 'Your sourcing is active. Start reviewing candidates to improve match quality.'}
                    </p>
                </div>
                <div className="ai-health-right">
                    <div className="ai-health-pct">{displayScore}%</div>
                    <div className="ai-health-pct-label">Match Score Avg</div>
                </div>
            </div>

            {/* Quick Breakdown */}
            <div className="quick-breakdown-card" style={{ flex: '1' }}>
                <div className="quick-breakdown-title">Quick Breakdown</div>
                {departments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem 0' }}>
                        No jobs yet
                    </p>
                ) : (
                    departments.slice(0, 5).map(([dept, count]) => (
                        <div className="breakdown-row" key={dept}>
                            <div className="breakdown-row-header">
                                <strong>{dept}</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    {count} Role{count !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="breakdown-bar-track">
                                <div
                                    className="breakdown-bar-fill"
                                    style={{
                                        width: `${(count / maxCount) * 100}%`,
                                        background: DEPT_COLORS[dept] ?? '#4f8ef7',
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AIHealthCard;
