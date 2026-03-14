import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import PricingSection from './components/PricingSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import ContactSection from './components/ContactSection';
import Register from './pages/Register';
import OTP from './pages/OTP';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ConfirmationPage from './pages/ConfirmationPage';
import RecruiterOnboarding from './pages/RecruiterOnboarding';
import EventsPage from './pages/EventsPage';
import ConnectRecruiter from './pages/ConnectRecruiter';
import FindJobs from './pages/FindJobs';
import RecruiterDashboard from './pages/RecruiterDashboard';
import SkillZone from './pages/candidate/SkillZone/index';
import Experience from './pages/candidate/SkillZone/Experience';
import ResumeUpload from './pages/candidate/SkillZone/ResumeUpload';
import Instructions from './pages/candidate/SkillZone/Instructions';
import Permissions from './pages/candidate/SkillZone/Permissions';
import SecureInstructions from './pages/candidate/SkillZone/SecureInstructions';
import Assessment from './pages/candidate/SkillZone/Assessment';
import Result from './pages/candidate/SkillZone/Result';
import CandidateProfile from './pages/CandidateProfile';
import AdminDashboard from './pages/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// ── Candidate route map ────────────────────────────────────────
const CANDIDATE_ROUTES: Record<string, string> = {
  dashboard: '#/candidate/dashboard',
  events: '#/candidate/events',
  'find-jobs': '#/candidate/find-jobs',
  'connect-recruiter': '#/candidate/connect-recruiter',
  'skill-zone': '#/candidate/skill-zone',
  profile: '#/candidate/profile',
};

/**
 * navHandler: used by every candidate page to navigate.
 * Accepts a page key (e.g. 'dashboard', 'events') and sets the hash.
 */
const navHandler = (page: string) => {
  const hash = CANDIDATE_ROUTES[page] ?? `#/candidate/${page}`;
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};

import { getProfile, getAuthUser } from './utils/profileStore';
import { useAuth } from './context/AuthContext';

function resolveHash(fullHash: string): string {
  const hash = fullHash.split('?')[0];

  // ── Cleanup #/home to #/ ──────────────────────────────────────
  if (hash === '#/home' || hash === '#home') {
    window.location.hash = '';
    return 'home';
  }

  // ── Route Guard: block candidate pages if not onboarded ──────
  const isCandidateRoute = hash.startsWith('#/candidate/') || hash === '#dashboard' || hash === '#events' || hash === '#find-jobs' || hash === '#connect-recruiter' || hash === '#skill-zone' || hash === '#/#events';
  if (isCandidateRoute) {
    const auth = getAuthUser();
    const profile = getProfile();
    // Only block if they are logged in as a candidate and haven't finished onboarding
    if (auth && auth.role === 'candidate' && !profile.onboardingDone) {
      window.location.hash = '#/users/Cofirmation-Page';
      return 'confirmation';
    }
  }

  // ── New candidate routes ──────────────────────────────────────
  if (hash === '#/candidate/dashboard') return 'candidate-dashboard';
  if (hash === '#/candidate/events') return 'candidate-events';
  if (hash === '#/candidate/find-jobs') return 'candidate-find-jobs';
  if (hash === '#/candidate/connect-recruiter') return 'candidate-connect-recruiter';
  if (hash === '#/candidate/skill-zone') return 'candidate-skill-zone';
  if (hash === '#/candidate/skill-zone/experience') return 'candidate-sz-experience';
  if (hash === '#/candidate/skill-zone/resume') return 'candidate-sz-resume';
  if (hash === '#/candidate/skill-zone/instructions') return 'candidate-sz-instructions';
  if (hash === '#/candidate/skill-zone/permissions') return 'candidate-sz-permissions';
  if (hash === '#/candidate/skill-zone/secure-instructions') return 'candidate-sz-secure-instructions';
  if (hash === '#/candidate/skill-zone/assessment') return 'candidate-sz-assessment';
  if (hash === '#/candidate/skill-zone/result') return 'candidate-sz-result';
  // Future-proof: any other /candidate/* path
  if (hash.startsWith('#/candidate/')) return `candidate-${hash.slice(12)}`;

  // ── Legacy redirects (old routes → new ones) ─────────────────
  if (hash === '#dashboard') { window.location.hash = '#/candidate/dashboard'; return 'candidate-dashboard'; }
  if (hash === '#events' || hash === '#/#events') { window.location.hash = '#/candidate/events'; return 'candidate-events'; }
  if (hash === '#find-jobs') { window.location.hash = '#/candidate/find-jobs'; return 'candidate-find-jobs'; }
  if (hash === '#connect-recruiter') { window.location.hash = '#/candidate/connect-recruiter'; return 'candidate-connect-recruiter'; }
  if (hash === '#skill-zone') { window.location.hash = '#/candidate/skill-zone'; return 'candidate-skill-zone'; }

  // ── Auth & other pages ────────────────────────────────────────
  if (hash === '#/#register' || hash === '#/register') return 'register';
  if (hash === '#/#register/#otp' || hash === '#/register/#otp') return 'otp';
  if (hash === '#/login') return 'login';
  if (hash === '#/forgot-password' || hash === '#forgot-password') return 'forgot-password';
  if (hash === '#/users/Cofirmation-Page') return 'confirmation';
  if (hash === '#/recruiter/onboarding_page') return 'recruiter-onboarding';
  if (hash === '#/recruiter/dashboard') return 'recruiter-dashboard';
  if (hash === '#/admin/login') return 'admin-login';
  if (hash === '#/admin/dashboard') return 'admin-dashboard';
  if (hash === '#/payment/success') return 'payment-success';
  if (hash === '#/payment/cancel') return 'payment-cancel';

  // ── Internal Section Anchors (prevent re-render) ─────────────
  const sectionAnchors = ['#features', '#how-it-works', '#pricing', '#contact'];
  if (sectionAnchors.includes(hash)) return 'home';

  if (!hash || hash === '#' || hash === '#/') return 'home';
  return hash.slice(1);  // generic fallback
}

function App() {
  const { isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(() => resolveHash(window.location.hash));

  useEffect(() => {
    if (!isLoading) {
      const handler = () => setCurrentPage(resolveHash(window.location.hash));
      handler();
      window.addEventListener('hashchange', handler);
      return () => window.removeEventListener('hashchange', handler);
    }
  }, [isLoading]);

  if (isLoading) {
      return (
          <div className="sz-root" style={{ alignItems: 'center', justifyContent: 'center' }}>
              <div className="sz-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          </div>
      );
  }

  // ── Candidate Pages ───────────────────────────────────────────
  if (currentPage === 'candidate-dashboard') return <Dashboard onNavigate={navHandler} />;
  if (currentPage === 'candidate-events') return <EventsPage onNavigate={navHandler} />;
  if (currentPage === 'candidate-find-jobs') return <FindJobs onNavigate={navHandler} />;
  if (currentPage === 'candidate-connect-recruiter') return <ConnectRecruiter onNavigate={navHandler} />;
  if (currentPage === 'candidate-skill-zone') return <SkillZone onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-experience') return <Experience onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-resume') return <ResumeUpload onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-instructions') return <Instructions onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-permissions') return <Permissions onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-secure-instructions') return <SecureInstructions onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-assessment') return <Assessment onNavigate={navHandler} />;
  if (currentPage === 'candidate-sz-result') return <Result onNavigate={navHandler} />;
  if (currentPage === 'candidate-profile') return <CandidateProfile onNavigate={navHandler} />;
  if (currentPage === 'admin-dashboard') return <AdminDashboard />;
  if (currentPage === 'payment-success') return <PaymentSuccess onNavigate={navHandler} />;
  if (currentPage === 'payment-cancel') return <PaymentCancel />;

  // ── Auth pages ────────────────────────────────────────────────
  if (currentPage === 'register') return <Register />;
  if (currentPage === 'otp') return <OTP />;
  if (currentPage === 'login') return <Login />;
  if (currentPage === 'forgot-password') return <ForgotPassword />;
  if (currentPage === 'confirmation') return <ConfirmationPage />;
  if (currentPage === 'recruiter-onboarding') return <RecruiterOnboarding />;
  if (currentPage === 'recruiter-dashboard') return <RecruiterDashboard />;

  // ── Landing page ──────────────────────────────────────────────
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <PricingSection />
        <CTASection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
