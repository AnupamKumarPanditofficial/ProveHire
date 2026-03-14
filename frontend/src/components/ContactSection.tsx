import { useState } from 'react';
import { Send, CheckCircle2, Mail, Tag, MessageSquare } from 'lucide-react';
import './ContactSection.css';

const MESSAGES_KEY = 'PROVAHIRE_MESSAGES';

export interface ContactMessage {
    id: string;
    email: string;
    subject: string;
    message: string;
    date: string;       // ISO string
    read: boolean;
}

function saveMessage(msg: Omit<ContactMessage, 'id' | 'date' | 'read'>) {
    const stored: ContactMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
    stored.unshift({
        ...msg,
        id: Date.now().toString(),
        date: new Date().toISOString(),
        read: false,
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(stored));
}

const ContactSection = () => {
    const [form, setForm] = useState({ email: '', subject: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [errors, setErrors] = useState<Partial<typeof form>>({});

    const validate = () => {
        const e: Partial<typeof form> = {};
        if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email';
        if (!form.subject.trim()) e.subject = 'Subject is required';
        if (form.message.trim().length < 15) e.message = 'Message must be at least 15 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        await new Promise(r => setTimeout(r, 700)); // UX delay
        saveMessage(form);
        setSent(true);
        setLoading(false);
        setForm({ email: '', subject: '', message: '' });
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <section className="cs-section" id="contact">
            <div className="cs-container">
                {/* Left — heading */}
                <div className="cs-left">
                    <span className="cs-badge">GET IN TOUCH</span>
                    <h2 className="cs-heading">
                        Send us a <span className="cs-hl">Message</span>
                    </h2>
                    <p className="cs-desc">
                        Have a question, feedback, or partnership proposal?
                        Our team will get back to you within 24 hours.
                    </p>
                    <div className="cs-info-list">
                        <div className="cs-info-item"><Mail size={15} /> support@provahire.io</div>
                        <div className="cs-info-item"><MessageSquare size={15} /> Response within 24 hours</div>
                    </div>
                </div>

                {/* Right — form */}
                <div className="cs-form-card">
                    {sent ? (
                        <div className="cs-success">
                            <CheckCircle2 size={42} className="cs-success-icon" />
                            <h3>Message Sent!</h3>
                            <p>Thanks for reaching out. We'll reply to your email shortly.</p>
                        </div>
                    ) : (
                        <form className="cs-form" onSubmit={handleSubmit} noValidate>
                            <div className="cs-field">
                                <label className="cs-label">Email Address</label>
                                <div className={`cs-input-wrap ${errors.email ? 'error' : ''}`}>
                                    <Mail size={15} className="cs-fi" />
                                    <input
                                        className="cs-input"
                                        type="email"
                                        placeholder="you@company.com"
                                        value={form.email}
                                        onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
                                    />
                                </div>
                                {errors.email && <p className="cs-error">{errors.email}</p>}
                            </div>

                            <div className="cs-field">
                                <label className="cs-label">Subject</label>
                                <div className={`cs-input-wrap ${errors.subject ? 'error' : ''}`}>
                                    <Tag size={15} className="cs-fi" />
                                    <input
                                        className="cs-input"
                                        type="text"
                                        placeholder="How can we help?"
                                        value={form.subject}
                                        onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: '' })); }}
                                    />
                                </div>
                                {errors.subject && <p className="cs-error">{errors.subject}</p>}
                            </div>

                            <div className="cs-field">
                                <label className="cs-label">Message</label>
                                <div className={`cs-input-wrap cs-textarea-wrap ${errors.message ? 'error' : ''}`}>
                                    <textarea
                                        className="cs-input cs-textarea"
                                        placeholder="Tell us what you need..."
                                        rows={5}
                                        value={form.message}
                                        onChange={e => { setForm(p => ({ ...p, message: e.target.value })); setErrors(p => ({ ...p, message: '' })); }}
                                    />
                                </div>
                                {errors.message && <p className="cs-error">{errors.message}</p>}
                            </div>

                            <button className="cs-submit-btn" type="submit" disabled={loading}>
                                {loading
                                    ? <><span className="cs-spinner" /> Sending...</>
                                    : <><Send size={15} /> Submit Message</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
