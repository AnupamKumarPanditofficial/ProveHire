import { useState, useEffect } from 'react';
import {
    Search, MapPin,
    X, ArrowRight, TrendingUp,
    DollarSign, Filter, Sparkles,
    AlertTriangle, RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '../globalConfig';
import CandidateHeader from '../components/CandidateHeader';
import FilterDropdown from '../components/FilterDropdown';
import './FindJobs.css';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    type: string;
    posted: string;
    description: string;
    requirements: string[];
    logo: string;
}

const FindJobs = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('All Locations');
    const [selectedType, setSelectedType] = useState('All Types');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [scoreStatus, setScoreStatus] = useState<'none' | 'low' | 'high'>('none');
    const [loadingScore, setLoadingScore] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    useEffect(() => {
        // Mock fetch jobs
        setTimeout(() => {
            setJobs([
                {
                    id: '1',
                    title: 'Senior Frontend Engineer',
                    company: 'TechFlow',
                    location: 'Remote',
                    salary: '₹18L - ₹24L',
                    type: 'Full-time',
                    posted: '2 days ago',
                    logo: 'TF',
                    description: 'We are looking for a Senior Frontend Engineer to join our core team...',
                    requirements: ['5+ years React experience', 'TypeScript expertise', 'UI/UX focus']
                },
                {
                    id: '2',
                    title: 'Full Stack Developer',
                    company: 'BuildStore',
                    location: 'Bangalore',
                    salary: '₹12L - ₹18L',
                    type: 'Full-time',
                    posted: '5h ago',
                    logo: 'BS',
                    description: 'Join our fast-growing startup to build the next generation of e-commerce...',
                    requirements: ['Node.js', 'React', 'MongoDB', 'AWS']
                },
                {
                    id: '3',
                    title: 'DevOps Specialist',
                    company: 'CloudScale',
                    location: 'Hyderabad',
                    salary: '₹15L - ₹22L',
                    type: 'Contract',
                    posted: '1 week ago',
                    logo: 'CS',
                    description: 'Help us scale our infrastructure to support millions of users...',
                    requirements: ['Docker/Kubernetes', 'CI/CD', 'Terraform']
                }
            ]);
            setLoading(false);
        }, 800);
    }, []);

    const checkHireScore = async () => {
        setLoadingScore(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/candidate/dashboard`);
            if (res.ok) {
                const data = await res.json();
                const exists = data.scores.hireScoreExists;
                const score = data.scores.hireScore;

                if (!exists || score < 70) {
                    setScoreStatus(exists ? 'low' : 'none');
                    setShowScoreModal(true);
                } else {
                    handleApply();
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingScore(false);
        }
    };

    const handleApply = () => {
        setIsApplying(true);
        setTimeout(() => {
            setIsApplying(false);
            setShowSuccessToast(true);
            setSelectedJob(null);
            setTimeout(() => setShowSuccessToast(false), 3000);
        }, 1500);
    };

    return (
        <div className="fj-root">
            <CandidateHeader activePage="find-jobs" onNavigate={onNavigate} />

            <div className="fj-content">
                <header className="fj-header">
                    <h1 className="fj-title">Find Your Next <span className="fj-accent">Career Move</span></h1>
                    <p className="fj-subtitle">Propel your career with AI-matched opportunities and direct recruiter access.</p>

                    <div className="fj-search-bar">
                        <div className="fj-input-group">
                            <Search size={18} className="fj-search-icon" />
                            <input
                                type="text"
                                placeholder="Job title, keywords, or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="fj-divider" />
                        <FilterDropdown
                            label="Location"
                            value={selectedLocation}
                            options={['All', 'Remote', 'Bangalore', 'Hyderabad', 'Pune']}
                            onChange={setSelectedLocation}
                            icon={<MapPin size={16} />}
                        />
                        <div className="fj-divider" />
                        <FilterDropdown
                            label="Job Type"
                            value={selectedType}
                            options={['All Types', 'Full-time', 'Contract', 'Internship']}
                            onChange={setSelectedType}
                            icon={<Filter size={16} />}
                        />
                        <button className="fj-search-btn">Search</button>
                    </div>

                    <div className="fj-tags">
                        <span className="fj-tag-label">Trending:</span>
                        {['React', 'Node.js', 'Python', 'DevOps', 'UI Design'].map(tag => (
                            <button key={tag} className="fj-tag" onClick={() => setSearchQuery(tag)}>{tag}</button>
                        ))}
                    </div>
                </header>

                <main className="fj-main">
                    <div className="fj-stats">
                        <p>Showing <b>{jobs.length}</b> premium jobs matching your profile</p>
                        <div className="fj-sort">
                            <span>Sort by:</span>
                            <select>
                                <option>Most Recent</option>
                                <option>Highest Salary</option>
                                <option>Company Rating</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="fj-loading">
                            <RefreshCw size={40} className="fj-spinner" />
                            <p>Tailoring jobs for your profile...</p>
                        </div>
                    ) : (
                        <div className="fj-grid">
                            {jobs.map(job => (
                                <div key={job.id} className="fj-card" onClick={() => setSelectedJob(job)}>
                                    <div className="fj-card-top">
                                        <div className="fj-company-logo">{job.logo}</div>
                                        <div className="fj-job-posted">{job.posted}</div>
                                    </div>
                                    <div className="fj-card-info">
                                        <h3 className="fj-job-title">{job.title}</h3>
                                        <p className="fj-company-name">{job.company}</p>
                                    </div>
                                    <div className="fj-card-details">
                                        <div className="fj-detail">
                                            <MapPin size={14} /> {job.location}
                                        </div>
                                        <div className="fj-detail">
                                            <DollarSign size={14} /> {job.salary}
                                        </div>
                                        <div className="fj-detail">
                                            <TrendingUp size={14} /> {job.type}
                                        </div>
                                    </div>
                                    <div className="fj-card-footer">
                                        <div className="fj-ai-badge">
                                            <Sparkles size={12} /> 94% AI Match
                                        </div>
                                        <ArrowRight size={18} className="fj-arrow" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Job Details Modal */}
            {selectedJob && (
                <div className="fj-modal-overlay" onClick={() => setSelectedJob(null)}>
                    <div className="fj-modal-content slide-up" onClick={e => e.stopPropagation()}>
                        <button className="fj-modal-close" onClick={() => setSelectedJob(null)}><X size={20} /></button>

                        <div className="fj-modal-header">
                            <div className="fj-modal-company">
                                <div className="fj-company-logo-lg">{selectedJob.logo}</div>
                                <div>
                                    <h2 className="fj-modal-title">{selectedJob.title}</h2>
                                    <p className="fj-modal-biz">{selectedJob.company} • {selectedJob.location}</p>
                                </div>
                            </div>
                            <div className="fj-modal-badges">
                                <span className="fj-mb">{selectedJob.type}</span>
                                <span className="fj-mb fj-salary">{selectedJob.salary}</span>
                            </div>
                        </div>

                        <div className="fj-modal-body">
                            <h3>Job Description</h3>
                            <p>{selectedJob.description}</p>

                            <h3>Key Requirements</h3>
                            <ul>
                                {selectedJob.requirements.map((req, i) => <li key={i}>{req}</li>)}
                            </ul>

                            <div className="fj-ai-insight">
                                <Sparkles size={16} />
                                <p>This role heavily matches your <b>Technical Assessment</b> score in React & Frontend systems.</p>
                            </div>
                        </div>

                        <div className="fj-modal-footer">
                            <button className="fj-save-btn">Save Job</button>
                            <button
                                className="fj-apply-btn"
                                onClick={checkHireScore}
                                disabled={loadingScore || isApplying}
                            >
                                {loadingScore ? 'Checking Eligibility...' : isApplying ? 'Submitting...' : 'Apply Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Score Warning Modal */}
            {showScoreModal && (
                <div className="fj-modal-overlay">
                    <div className="fj-score-alert bounce-in">
                        <AlertTriangle size={48} color="#f59e0b" />
                        <h2>Low Hire Score</h2>
                        <p>
                            {scoreStatus === 'none'
                                ? "You haven't completed any skill assessments yet. Companies require a Hire Score of 70+ to apply."
                                : "Your current Hire Score is below the 70% threshold required for this position."}
                        </p>
                        <div className="fj-alert-actions">
                            <button className="fj-btn-secondary" onClick={() => setShowScoreModal(false)}>Close</button>
                            <button className="fj-btn-primary" onClick={() => onNavigate('skill-zone')}>Go to Skill Zone</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessToast && (
                <div className="fj-toast-success slide-in-top">
                    Application successfully submitted! We'll notify you when the recruiter responds.
                </div>
            )}
        </div>
    );
};

export default FindJobs;
