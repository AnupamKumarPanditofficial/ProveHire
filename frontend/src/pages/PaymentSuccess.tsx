import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import '../components/PricingSection.css'; // Reuse some styles

const PaymentSuccess = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // In a real app, you might verify the session_id with the backend here
        // For now, we wait a bit to simulate processing, then refresh the profile
        const timer = setTimeout(() => {
            setVerifying(false);
            // Refresh logic: clear local cache to force a fresh fetch on dashboard
            localStorage.removeItem('PROVAHIRE_PROFILE');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="payment-outcome-container slide-in" style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            background: '#0f172a', color: '#fff'
        }}>
            <div className="outcome-card glass-panel" style={{ padding: '3rem', borderRadius: '24px', maxWidth: '500px' }}>
                {verifying ? (
                    <>
                        <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Verifying Payment...</h2>
                        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Please wait while we activate your premium features.</p>
                    </>
                ) : (
                    <>
                        <div style={{ color: '#10b981', marginBottom: '1.5rem' }}>
                            <CheckCircle2 size={64} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Successful!</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6 }}>
                            Congratulations! Your ProvaHire Premium subscription is now active. You have unlocked all the pro features.
                        </p>
                        <button
                            className="cta-btn primary-btn"
                            onClick={() => onNavigate('dashboard')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', padding: '0.8rem 2rem' }}
                        >
                            Go to Dashboard <ArrowRight size={18} />
                        </button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .payment-outcome-container { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
};

export default PaymentSuccess;
