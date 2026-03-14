import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
    return (
        <div className="payment-outcome-container slide-in" style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            background: '#0f172a', color: '#fff'
        }}>
            <div className="outcome-card glass-panel" style={{ padding: '3rem', borderRadius: '24px', maxWidth: '500px' }}>
                <div style={{ color: '#ef4444', marginBottom: '1.5rem' }}>
                    <XCircle size={64} />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Cancelled</h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.6 }}>
                    No worries! Your payment session was cancelled. No charges were made.
                </p>
                <button
                    className="cta-btn secondary-btn"
                    onClick={() => { window.location.hash = '#pricing'; window.dispatchEvent(new HashChangeEvent('hashchange')); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', padding: '0.8rem 2rem' }}
                >
                    <ArrowLeft size={18} /> Return to Pricing
                </button>
            </div>
        </div>
    );
};

export default PaymentCancel;
