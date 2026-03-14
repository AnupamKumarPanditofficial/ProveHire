import { Check, Star, Shield, Zap, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { API_BASE_URL } from '../globalConfig';
import { getAuthUser } from '../utils/profileStore';
import './PricingSection.css';

const PRICING_PLANS = [
    {
        name: 'Basic',
        price: '₹100',
        amount: 100,
        period: '/month',
        description: 'Perfect for getting started with your job search.',
        features: ['AI Resume Builder', '5 Skill Tests/mo', 'Pro Badge'],
        icon: <Zap size={24} />,
        color: '#3b82f6', // Blue
        glow: 'rgba(59, 130, 246, 0.4)',
        popular: false,
    },
    {
        name: 'Pro',
        price: '₹150',
        amount: 150,
        period: '/month',
        description: 'Everything in Basic, plus recruiter assistance.',
        features: ['AI Resume Builder', 'Unlimited Skill Tests', 'Direct Recruiter Access', 'Pro Badge'],
        icon: <Star size={24} />,
        color: '#8b5cf6', // Purple
        glow: 'rgba(139, 92, 246, 0.5)',
        popular: true,
    },
    {
        name: 'Elite',
        price: '₹250',
        amount: 250,
        period: '/month',
        description: 'Complete help from all premium features.',
        features: ['AI Resume Builder', 'Unlimited Skill Tests', 'Direct Recruiter Access', 'Priority Support', 'Pro Badge'],
        icon: <Shield size={24} />,
        color: '#10b981', // Emerald
        glow: 'rgba(16, 185, 129, 0.4)',
        popular: false,
    }
];

const PricingSection = () => {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const auth = getAuthUser();

    const handleUpgrade = async (plan: typeof PRICING_PLANS[0]) => {
        if (!auth) {
            window.location.hash = '#/register';
            return;
        }

        if (auth.role !== 'candidate') {
            alert('Subscriptions are currently only available for Candidate accounts.');
            return;
        }

        setLoadingPlan(plan.name);
        try {
            const token = localStorage.getItem('PROVAHIRE_ACCESS_TOKEN');
            const response = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    planName: plan.name,
                    priceAmount: plan.amount
                })
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe Checkout
            } else {
                throw new Error(data.message || 'Failed to create payment session');
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            alert(error.message || 'Payment service is currently unavailable. Please try again later.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section id="pricing" className="pricing-section">
            <div className="container pricing-container">
                <div className="pricing-header">
                    <span className="section-eyebrow">PREMIUM PLANS</span>
                    <h2 className="section-title">Upgrade Your <span className="gradient-text">Career</span></h2>
                    <p className="section-subtitle">
                        Unlock powerful AI tools and connect directly with top recruiters.
                    </p>
                </div>

                <div className="pricing-grid">
                    {PRICING_PLANS.map((plan, index) => (
                        <div
                            key={index}
                            className={`pricing-card ${plan.popular ? 'popular' : ''}`}
                            style={{ '--plan-color': plan.color, '--plan-glow': plan.glow } as React.CSSProperties}
                        >
                            {plan.popular && <div className="popular-badge">Most Popular</div>}

                            <div className="pricing-card-header">
                                <div className="plan-icon" style={{ color: plan.color, background: `${plan.color}20` }}>
                                    {plan.icon}
                                </div>
                                <h3 className="plan-name">{plan.name}</h3>
                                <div className="plan-price-wrap">
                                    <span className="plan-price">{plan.price}</span>
                                    <span className="plan-period">{plan.period}</span>
                                </div>
                                <p className="plan-desc">{plan.description}</p>
                            </div>

                            <ul className="plan-features">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx}>
                                        <div className="feature-check" style={{ background: `${plan.color}20`, color: plan.color }}>
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                className="pricing-btn"
                                onClick={() => handleUpgrade(plan)}
                                disabled={loadingPlan !== null}
                                style={{
                                    background: plan.popular ? `linear-gradient(135deg, ${plan.color}, #6366f1)` : 'transparent',
                                    borderColor: plan.popular ? 'transparent' : plan.color,
                                    color: plan.popular ? '#fff' : plan.color,
                                    cursor: loadingPlan ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loadingPlan === plan.name ? (
                                    <>
                                        <Loader2 size={18} className="spin-anim" /> Processing...
                                    </>
                                ) : 'Upgrade Now'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </section>
    );
};

export default PricingSection;

