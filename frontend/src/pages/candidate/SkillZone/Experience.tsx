import { useState } from 'react';
import { Shield, Sparkles, ArrowRight } from 'lucide-react';
import CandidateHeader from '../../../components/CandidateHeader';
import { CAREERS } from './careersData';
import { ParticleCanvas } from './ParticleCanvas';

interface ExperienceLevel {
    id: string;
    label: string;
    sub: string;
}

const EXPERIENCE: ExperienceLevel[] = [
    { id: 'fresher', label: 'Fresher', sub: 'No industry experience' },
    { id: '0-2', label: '0 – 2 Years', sub: 'Junior level' },
    { id: '2-5', label: '2 – 5 Years', sub: 'Mid level' },
    { id: '5+', label: '5+ Years', sub: 'Senior / Lead' },
];

interface Props { onNavigate: (p: string) => void; }

const Experience = ({ onNavigate }: Props) => {
    const [selectedExp, setSelectedExp] = useState<string | null>(null);
    const [starting, setStarting] = useState(false);

    const savedCareerId = sessionStorage.getItem('sz_career');
    const career = CAREERS.find(c => c.id === savedCareerId);

    // Guard route: if they bypassed step 1, send them back
    if (!savedCareerId || !career) {
        onNavigate('skill-zone');
        return null;
    }

    const handleContinue = () => {
        if (!selectedExp) return;
        setStarting(true);
        sessionStorage.setItem('sz_experience', selectedExp);
        setTimeout(() => {
            setStarting(false);
            onNavigate('skill-zone/resume');
        }, 800);
    };

    return (
        <div className="sz-root">
            <ParticleCanvas />

            <div className="sz-glow sz-glow1" />
            <div className="sz-glow sz-glow2" />
            <div className="sz-glow sz-glow3" />

            <CandidateHeader activePage="skill-zone" onNavigate={onNavigate} />

            <div className="sz-content">
                <div className="sz-steps-indicator">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className="sz-step-item" style={{ flex: '1 1 0' }}>
                            <div className={`sz-step-dot ${2 >= s ? 'active' : ''} ${2 > s ? 'done' : ''}`}>
                                {2 > s ? '✓' : s}
                            </div>
                            <span className={`sz-step-label ${2 === s ? 'active' : ''}`} style={{ fontSize: '0.7rem' }}>
                                {s === 1 ? 'Career' : s === 2 ? 'Experience' : s === 3 ? 'Resume' : s === 4 ? 'Rules' : 'Setup'}
                            </span>
                            {s < 5 && <div className={`sz-step-line ${2 > s ? 'done' : ''}`} />}
                        </div>
                    ))}
                </div>

                <div className="sz-step-panel sz-step2">
                    <button className="sz-back-btn" onClick={() => onNavigate('skill-zone')}>← Back</button>

                    <div className="sz-hero-badge"><Shield size={13} /> Adaptive Assessment</div>
                    <h1 className="sz-title">Select Your <span className="sz-accent">Experience Level</span></h1>

                    <div className="sz-ai-message">
                        <div className="sz-ai-icon"><Sparkles size={15} /></div>
                        <p>Assessment will adapt based on your experience — delivering the most accurate skill evaluation for <strong>{career.title}</strong>.</p>
                    </div>

                    <div className="sz-exp-grid">
                        {EXPERIENCE.map(e => {
                            const isSelected = selectedExp === e.id;
                            return (
                                <div
                                    key={e.id}
                                    className={`sz-exp-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedExp(e.id)}
                                >
                                    <div className={`sz-exp-radio ${isSelected ? 'checked' : ''}`}>
                                        {isSelected && <div className="sz-exp-radio-inner" />}
                                    </div>
                                    <div>
                                        <p className="sz-exp-label">{e.label}</p>
                                        <p className="sz-exp-sub">{e.sub}</p>
                                    </div>
                                    {isSelected && <div className="sz-exp-glow" />}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className={`sz-btn-primary sz-btn-start ${!selectedExp ? 'disabled' : ''} ${starting ? 'loading' : ''}`}
                        onClick={handleContinue}
                        disabled={!selectedExp || starting}
                    >
                        {starting ? (
                            <><span className="sz-spinner" /> Proceeding...</>
                        ) : (
                            <>Continue to Rules <ArrowRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Experience;
