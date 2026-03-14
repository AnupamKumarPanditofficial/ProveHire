import { FileSearch, CheckSquare, Users } from 'lucide-react';
import './Features.css';

const Features = () => {
    return (
        <section className="features-section" id="features">
            <div className="container">

                <div className="section-header">
                    <h2 className="section-title">Why Choose ProvaHire?</h2>
                    <p className="section-subtitle">
                        Powerful features designed to optimize every stage of hiring.
                    </p>
                </div>

                <div className="features-grid">

                    <div className="feature-card glass-panel">
                        <div className="feature-icon blue-icon">
                            <FileSearch size={22} />
                        </div>
                        <h3 className="feature-title">AI Resume Screener</h3>
                        <p className="feature-desc">
                            Automatically parse, rank, and shortlist the best candidates based on deep semantic matching with your job descriptions.
                        </p>
                    </div>

                    <div className="feature-card glass-panel">
                        <div className="feature-icon purple-icon">
                            <CheckSquare size={22} />
                        </div>
                        <h3 className="feature-title">Skill Assessment Tests</h3>
                        <p className="feature-desc">
                            Deploy integrated technical challenges and soft skill assessments that verify candidate claims instantly.
                        </p>
                    </div>

                    <div className="feature-card glass-panel">
                        <div className="feature-icon green-icon">
                            <Users size={22} />
                        </div>
                        <h3 className="feature-title">Life Score Matching</h3>
                        <p className="feature-desc">
                            Our proprietary algorithm predicts long-term culture fit and retention probability, reducing turnover risks.
                        </p>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default Features;
