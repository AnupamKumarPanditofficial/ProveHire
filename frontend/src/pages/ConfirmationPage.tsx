import { useState } from 'react';
import { ArrowRight, ShieldCheck, RefreshCw, IdCard } from 'lucide-react';
import CandidateHeader from '../components/CandidateHeader';
import EducationDetails from '../components/EducationDetails';
import CareerPreferences from '../components/CareerPreferences';
import ProfessionalSetup from '../components/ProfessionalSetup';
import { saveProfile } from '../utils/profileStore';
import './ConfirmationPage.css';

// Step config: step key, label, base progress target when entering step
const STEPS = [
    { key: 'initial', label: 'Start', baseProgress: 0 },
    { key: 'education', label: 'Education Details', baseProgress: 33 },
    { key: 'career', label: 'Career Preferences', baseProgress: 66 },
    { key: 'professional', label: 'Professional Setup', baseProgress: 100 },
    { key: 'done', label: 'Done', baseProgress: 100 },
] as const;

type StepKey = typeof STEPS[number]['key'];

const ConfirmationPage = () => {
    const [currentStep, setCurrentStep] = useState<StepKey>('initial');

    const goTo = (step: StepKey) => setCurrentStep(step);

    const currentProgress = STEPS.find(s => s.key === currentStep)?.baseProgress ?? 0;

    return (
        <div className="confirmation-page">
            <CandidateHeader activePage="profile" onNavigate={(page) => { window.location.hash = `#/candidate/${page}`; }} />

            <main className="confirmation-content">
                {currentStep === 'initial' && (
                    <>
                        <div className="onboarding-card">
                            <div className="card-top-glow"></div>
                            <div className="card-icon-container">
                                <IdCard size={48} strokeWidth={1.5} className="id-card-icon" />
                            </div>
                            <div className="badge-container">
                                <span className="onboarding-badge">ONBOARDING</span>
                            </div>
                            <h1 className="card-title">Complete Your Profile</h1>
                            <p className="card-subtitle">
                                Welcome to PROVAHIRE. Let's get your professional<br />
                                profile set up to match you with premium<br />
                                opportunities and top-tier tech firms.
                            </p>
                            <div className="progress-section">
                                <div className="progress-header">
                                    <span className="progress-label">Profile Readiness</span>
                                    <span className="progress-percentage">0%</span>
                                </div>
                                <div className="progress-bar-container">
                                    <div className="progress-bar-fill" style={{ width: '0%' }}></div>
                                </div>
                                <div className="progress-footer">
                                    <span className="estimated-time">Estimated time: 2-3 minutes</span>
                                    <span className="status-text">PENDING START</span>
                                </div>
                            </div>
                            <button className="start-setup-btn" onClick={() => goTo('education')}>
                                Start Setup <ArrowRight size={18} />
                            </button>
                            <div className="security-badges">
                                <span className="security-item">
                                    <ShieldCheck size={14} className="security-icon" /> Encrypted & Secure
                                </span>
                                <span className="security-item">
                                    <RefreshCw size={14} className="security-icon" /> Auto-save Progress
                                </span>
                            </div>
                        </div>
                        <div className="bottom-links">
                            <a href="#/privacy">Privacy Policy</a>
                            <a href="#/terms">Terms of Service</a>
                            <a href="#/support">Contact Support</a>
                        </div>
                    </>
                )}

                {currentStep === 'education' && (
                    <EducationDetails
                        onBack={() => goTo('initial')}
                        onNext={() => goTo('career')}
                        progress={currentProgress}
                    />
                )}

                {currentStep === 'career' && (
                    <CareerPreferences
                        onBack={() => goTo('education')}
                        onNext={() => goTo('professional')}
                        progress={currentProgress}
                    />
                )}

                {currentStep === 'professional' && (
                    <ProfessionalSetup
                        onBack={() => goTo('career')}
                        onFinish={() => {
                            saveProfile({ onboardingDone: true });
                            goTo('done');
                        }}
                        progress={currentProgress}
                    />
                )}

                {currentStep === 'done' && (
                    <div className="onboarding-card done-card">
                        <div className="done-icon">🎉</div>
                        <h2 className="done-title">You're All Set!</h2>
                        <p className="done-subtitle">
                            Your profile is complete. PROVAHIRE is now matching you<br />
                            with top-tier opportunities tailored to your skills.
                        </p>
                        <button
                            className="start-setup-btn"
                            onClick={() => {
                                window.location.hash = '#/candidate/dashboard';
                                window.dispatchEvent(new HashChangeEvent('hashchange'));
                            }}
                        >
                            Go to Dashboard <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ConfirmationPage;
