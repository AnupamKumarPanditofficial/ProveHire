import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { setMemoryToken } from '../utils/tokenMemory';
import { API_BASE_URL } from '../globalConfig';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoading(true);

                // Get role to choose correct me endpoint (Bug #5)
                const userRaw = localStorage.getItem('PROVAHIRE_USER');
                let role = 'candidate';
                if (userRaw) {
                    try { role = JSON.parse(userRaw).role; } catch (e) { }
                }

                const meUrl = role === 'recruiter'
                    ? `${API_BASE_URL}/api/recruiter-auth/me`
                    : `${API_BASE_URL}/api/auth/me`;

                const response = await fetch(meUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include' // Important for cookies
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                    setToken('memory-auth'); // The fetch interceptor handles injecting bearer
                } else {
                    setIsAuthenticated(false);
                    setToken(null);
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                setIsAuthenticated(false);
                setToken(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (newToken: string) => {
        setMemoryToken(newToken);
        setToken(newToken);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            const userRaw = localStorage.getItem('PROVAHIRE_USER');
            let role = 'candidate';
            if (userRaw) {
                try { role = JSON.parse(userRaw).role; } catch (e) { }
            }

            const logoutUrl = role === 'recruiter'
                ? `${API_BASE_URL}/api/recruiter-auth/logout`
                : `${API_BASE_URL}/api/auth/logout`;

            await fetch(logoutUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
        } catch (err) {
            console.error('Logout failed:', err);
        }
        setMemoryToken(null);
        localStorage.clear();
        setToken(null);
        setIsAuthenticated(false);
        // Hard redirect (Bug #3)
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
