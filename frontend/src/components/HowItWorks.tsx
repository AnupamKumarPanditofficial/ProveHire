import './HowItWorks.css';

const steps = [
    {
        num: 1,
        title: 'Create Account',
        desc: 'Sign up in seconds and configure your company profile.'
    },
    {
        num: 2,
        title: 'Post Job',
        desc: 'Use AI to generate optimized job descriptions.'
    },
    {
        num: 3,
        title: 'AI Screening',
        desc: 'Let our system rank and filter incoming applications.'
    },
    {
        num: 4,
        title: 'Hire',
        desc: 'Interview top candidates and make an offer.'
    }
];

const HowItWorks = () => {
    return (
        <section className="how-it-works-section" id="how-it-works">
            <div className="container">

                <div className="section-header">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle">
                        Four simple steps to finding your next top talent.
                    </p>
                </div>

                <div className="steps-container">
                    <div className="steps-line"></div>

                    <div className="steps-grid">
                        {steps.map((step, index) => (
                            <div key={index} className="step-item">
                                <div className={`step-number ${index === 3 ? 'step-number-active' : ''}`}>
                                    {step.num}
                                </div>
                                <h3 className="step-title">{step.title}</h3>
                                <p className="step-desc">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
};

export default HowItWorks;
