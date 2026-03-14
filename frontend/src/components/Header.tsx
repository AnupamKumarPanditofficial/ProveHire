import { User, Layers, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRef, useCallback } from 'react';
import './Header.css';

interface HeaderProps {
    minimal?: boolean;
}

const Header = ({ minimal = false }: HeaderProps) => {
    const { isAuthenticated, logout } = useAuth();

    // ── Secret 10-click admin access ──────────────────────────
    const clickCount = useRef(0);
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLogoClick = useCallback(() => {
        window.location.hash = ''; // Clear hash for root home
        clickCount.current += 1;
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => { clickCount.current = 0; }, 3000);
        if (clickCount.current >= 10) {
            clickCount.current = 0;
            window.location.hash = '#/admin/login';
            window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
    }, []);

    return (
        <header className="header">
            <div className="container header-container">
                <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
                    <Layers className="logo-icon" />
                    <span className="logo-text">
                        <span className="logo-letter">P</span>
                        <span className="logo-letter">r</span>
                        <span className="logo-letter">o</span>
                        <span className="logo-letter">v</span>
                        <span className="logo-letter">a</span>
                        <span className="logo-letter">H</span>
                        <span className="logo-letter">i</span>
                        <span className="logo-letter">r</span>
                        <span className="logo-letter">e</span>
                    </span>                </div>

                {!minimal && (
                    <nav className="main-nav">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#pricing">Pricing</a>
                    </nav>
                )}

                <div className="header-actions">
                    <div className="auth-buttons">
                        {isAuthenticated ? (
                            <>
                                {!minimal && (
                                    <a href="#dashboard" className="login-btn" style={{ textDecoration: 'none' }}>
                                        Dashboard
                                    </a>
                                )}
                                <button className="cta-btn primary-btn" onClick={() => { logout(); window.location.hash = ''; }} style={{ padding: '0.6rem 1rem' }}>
                                    <LogOut size={18} />
                                </button>
                            </>
                        ) : (
                            <>
                                <a href="#/login" className="login-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                    <User size={18} />
                                    Log In
                                </a>
                                <a href="#/#register" className="cta-btn primary-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Get Started</a>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
