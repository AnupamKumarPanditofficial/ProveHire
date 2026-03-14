import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

import { getMemoryToken, setMemoryToken } from './utils/tokenMemory';
import { API_BASE_URL } from './globalConfig';

// Global fetch interceptor to handle 401s & auto-attach AccessToken (Bug #3 & Ticket #8)
const originalFetch = window.fetch;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRerefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}
const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
}

window.fetch = async (...args) => {
  let [resource, config] = args;

  // Skip interceptor for refresh endpoints to prevent loops
  if (typeof resource === 'string' && (resource.includes('/api/auth/refresh') || resource.includes('/api/recruiter-auth/refresh'))) {
    return originalFetch(...args);
  }

  // Auto-attach Bearer token if we have one in memory
  const token = getMemoryToken();
  if (token && typeof resource === 'string' && resource.includes('/api/')) {
    config = config || {};
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
    args = [resource, config];
  }

  const response = await originalFetch(...args);

  if (response.status === 401) {
    const isLoginRoute = window.location.hash.includes('#/login') || window.location.hash === '' || window.location.hash === '#/';
    const isRegisterRoute = window.location.hash.includes('#/register');

    if (!isLoginRoute && !isRegisterRoute && !window.location.search.includes('reason=session_expired')) {

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // Get role to choose correct refresh endpoint
          let role = 'candidate';
          try {
            const userRaw = localStorage.getItem('PROVAHIRE_USER');
            if (userRaw) {
              const user = JSON.parse(userRaw);
              role = user.role || 'candidate';
            }
          } catch (e) { }

          const refreshUrl = role === 'recruiter'
            ? `${API_BASE_URL}/api/recruiter-auth/refresh`
            : `${API_BASE_URL}/api/auth/refresh`;

          const refreshRes = await originalFetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Send HttpOnly refresh token
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setMemoryToken(data.accessToken);
            isRefreshing = false;
            onRerefreshed(data.accessToken);

            // Retry original request
            let newConfig = (config as RequestInit) || {};
            newConfig.headers = {
              ...newConfig.headers,
              'Authorization': `Bearer ${data.accessToken}`
            };
            return originalFetch(resource, newConfig);
          }
        } catch (e) {
          console.error('Token refresh failed', e);
        }

        isRefreshing = false;
        // If refresh failed:
        const userRaw = localStorage.getItem('PROVAHIRE_USER');
        let role = 'candidate';
        if (userRaw) {
          try {
            const user = JSON.parse(userRaw);
            role = user.role || 'candidate';
            sessionStorage.setItem('pendingRedirect', JSON.stringify({
              url: window.location.hash,
              userId: user._id,
              role: user.role
            }));
          } catch (e) { }
        }
        setMemoryToken(null);
        localStorage.removeItem('PROVAHIRE_USER');
        // Do not clear sessionStorage to preserve the redirect binding
        window.location.href = `/?reason=session_expired#/login?role=${role}`;
      } else {
        // Queue this request, wait for refresh
        return new Promise(resolve => {
          addRefreshSubscriber((newToken) => {
            let newConfig = (config as RequestInit) || {};
            newConfig.headers = {
              ...newConfig.headers,
              'Authorization': `Bearer ${newToken}`
            };
            resolve(originalFetch(resource, newConfig));
          });
        });
      }
    }
  }
  return response;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
