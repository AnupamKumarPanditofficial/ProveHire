import { useState, useCallback } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, Layers } from 'lucide-react';
import './AdminLogin.css';

const ADMIN_ID = 'ProvaHire';
const ADMIN_KEY = 'Hire123';

const AdminLogin = () => {
    const [adminId, setAdminId] = useState('');
    const [passkey, setPasskey] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (adminId !== ADMIN_ID || passkey !== ADMIN_KEY) {
            setError('Invalid Admin ID or Passkey. Access denied.');
            return;
        }
        setLoading(true);
        sessionStorage.setItem('PROVAHIRE_ADMIN', 'true');
        // brief animation delay
        await new Promise(r => setTimeout(r, 700));
        window.location.hash = '#/admin/dashboard';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    }, [adminId, passkey]);

    return (
        <div className="adm-login-root">
            {/* Ambient blobs */}
            <div className="adm-blob adm-blob1" />
            <div className="adm-blob adm-blob2" />
            <div className="adm-blob adm-blob3" />

            <div className="adm-login-card">
                {/* Lock ring animation */}
                <div className="adm-lock-ring">
                    <div className="adm-lock-ring-inner">
                        <Lock size={28} className="adm-lock-icon" />
                    </div>
                </div>

                <div className="adm-login-badge">ADMIN ACCESS</div>
                <h1 className="adm-login-title">ProvaHire Control Center</h1>
                <p className="adm-login-sub">Restricted area — authorised personnel only</p>

                <form className="adm-login-form" onSubmit={handleLogin} autoComplete="off">
                    {error && (
                        <div className="adm-error">
                            <ShieldAlert size={15} /> {error}
                        </div>
                    )}

                    <div className="adm-form-group">
                        <label className="adm-label">Admin ID</label>
                        <div className="adm-input-wrap">
                            <Layers size={16} className="adm-input-icon" />
                            <input
                                className="adm-input"
                                type="text"
                                placeholder="Enter admin ID"
                                value={adminId}
                                onChange={e => { setAdminId(e.target.value); setError(''); }}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="adm-form-group">
                        <label className="adm-label">Passkey</label>
                        <div className="adm-input-wrap">
                            <Lock size={16} className="adm-input-icon" />
                            <input
                                className="adm-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Enter passkey"
                                value={passkey}
                                onChange={e => { setPasskey(e.target.value); setError(''); }}
                                autoComplete="new-password"
                            />
                            <button type="button" className="adm-eye-btn" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="adm-submit-btn"
                        disabled={loading || !adminId.trim() || !passkey.trim()}
                    >
                        {loading ? <><span className="adm-spinner" /> Authenticating...</> : 'Access Admin Panel'}
                    </button>
                </form>

                <p className="adm-back-link">
                    <a href="#home">← Back to ProvaHire</a>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
