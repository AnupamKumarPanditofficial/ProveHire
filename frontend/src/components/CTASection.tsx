import { Send, UserCircle2 } from 'lucide-react';
import './CTASection.css';

const CTASection = () => {
    return (
        <section className="cta-section">
            <div className="container">
                <div className="cta-split-container">

                    {/* Left Side: Founder's Note */}
                    <div className="cta-founder-note">
                        <div className="founder-badge">
                            <UserCircle2 size={16} />
                            <span>Founder's Note</span>
                        </div>
                        <h2 className="cta-title">Let's build the future of hiring, together.</h2>
                        <p className="cta-subtitle">
                            "At ProvaHire, our mission is to eliminate the friction in recruitment and make talent discovery seamless. Whether you have feedback, need support, or just want to chat about AI in HR, I'd love to hear from you directly."
                        </p>
                        <div className="founder-signature">
                            <h4 className="founder-name">Anupam Kumar Pandit</h4>
                            <span className="founder-role">Founder & CEO, ProvaHire</span>
                        </div>
                    </div>

                    {/* Right Side: Professional Contact Form */}
                    <div className="cta-form-wrapper">
                        <h3 className="form-head">Send a Message</h3>
                        <h3 className="form-head">Ready to Connect?</h3>
                        <p className="cta-subtitle" style={{ color: '#475569', marginBottom: '2rem' }}>
                            Have questions or want to partner with us? Drop us a line and our team will get back to you promptly.
                        </p>
                        <a href="#contact" className="pro-submit-btn" style={{ textDecoration: 'none', display: 'inline-flex', width: 'fit-content', padding: '1rem 2rem' }}>
                            <span>Get in Touch</span>
                            <Send size={16} />
                        </a>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default CTASection;
