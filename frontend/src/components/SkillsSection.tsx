import { useState } from 'react';
import { Search, X, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import { saveProfile } from '../utils/profileStore';
import './SkillsSection.css';

interface SkillsSectionProps {
    onBack: () => void;
    onNext: () => void;
    progress: number;
}

const SUGGESTED_SKILLS = ['TypeScript', 'Figma', 'Tailwind CSS', 'Node.js', 'GraphQL', 'Docker', 'AWS'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

interface Skill {
    name: string;
    level: string;
}

const SkillsSection = ({ onBack, onNext, progress }: SkillsSectionProps) => {
    const [skills, setSkills] = useState<Skill[]>([
        { name: 'React.js', level: 'Advanced' },
        { name: 'UI/UX Design', level: 'Expert' },
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    const addSkill = (skillName: string) => {
        const trimmed = skillName.trim();
        if (!trimmed) return;
        if (skills.find(s => s.name.toLowerCase() === trimmed.toLowerCase())) return;
        setSkills(prev => [...prev, { name: trimmed, level: 'Intermediate' }]);
        setSearchQuery('');
    };

    const removeSkill = (name: string) => {
        setSkills(prev => prev.filter(s => s.name !== name));
    };

    const setLevel = (name: string, level: string) => {
        setSkills(prev => prev.map(s => s.name === name ? { ...s, level } : s));
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') addSkill(searchQuery);
    };

    const canProceed = skills.length >= 1;

    return (
        <div className="skills-container">
            <div className="ob-header">
                <div className="ob-header-top">
                    <div className="ob-header-titles">
                        <span className="ob-main-title">Onboarding Progress</span>
                        <span className="ob-sub-title">Step 4 of 5: Technical Expertise</span>
                    </div>
                    <span className="ob-percent">{progress}%</span>
                </div>
                <div className="ob-bar-track">
                    <div className="ob-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="onboarding-card skills-card">
                <h2 className="skills-title">Tell us about your skills</h2>
                <p className="skills-subtitle">Add the technical skills and experience levels that define your expertise to match with premium opportunities.</p>

                <div className="skills-info-box">
                    <div className="skills-info-icon">
                        <Zap size={20} />
                    </div>
                    <div className="skills-info-text">
                        <strong>Skills & Proficiency</strong>
                        <span>Enter your top skills and select your proficiency level for each to complete your profile.</span>
                    </div>
                </div>

                <div className="add-skill-section">
                    <label className="section-label">Add Skill</label>
                    <div className="input-with-icon skill-input-wrapper">
                        <Search size={17} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Search skills (e.g. React, Figma, SQL, Python...)"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                </div>

                {skills.length > 0 && (
                    <div className="selected-skills-section">
                        <label className="section-label">Selected Skills</label>
                        <div className="selected-skills-grid">
                            {skills.map(skill => (
                                <div key={skill.name} className="skill-chip">
                                    <span className="skill-chip-name">{skill.name}</span>
                                    <select
                                        value={skill.level}
                                        onChange={e => setLevel(skill.name, e.target.value)}
                                        className="skill-level-select"
                                    >
                                        {SKILL_LEVELS.map(l => (
                                            <option key={l} value={l}>{l}</option>
                                        ))}
                                    </select>
                                    <button className="remove-skill-btn" onClick={() => removeSkill(skill.name)}>
                                        <X size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="suggested-skills-section">
                    <label className="section-label-muted">SUGGESTED FOR YOU</label>
                    <div className="suggested-chips">
                        {SUGGESTED_SKILLS.filter(s => !skills.find(sk => sk.name.toLowerCase() === s.toLowerCase())).map(s => (
                            <button key={s} className="suggested-chip" onClick={() => addSkill(s)}>
                                + {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button
                        className={`next-step-btn ${!canProceed ? 'disabled' : ''}`}
                        onClick={() => {
                            if (!canProceed) return;
                            const levelPct: Record<string, number> = { Beginner: 35, Intermediate: 60, Advanced: 80, Expert: 95 };
                            saveProfile({
                                skills: skills.map((s, i) => ({
                                    id: i + 1,
                                    name: s.name,
                                    level: s.level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
                                    pct: levelPct[s.level] ?? 60,
                                }))
                            });
                            onNext();
                        }}
                        disabled={!canProceed}
                    >
                        Continue <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillsSection;
