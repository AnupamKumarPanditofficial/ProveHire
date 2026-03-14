/**
 * profileStore.ts — shared localStorage helper for ProvaHire profile data.
 *
 * Schema (PROVAHIRE_PROFILE key):
 * {
 *   name: string,           from EducationDetails.fullName
 *   title: string,          from CareerPreferences.preferredRole
 *   location: string,       from CareerPreferences.preferredLocation
 *   email: string,          from JWT user (authstore)
 *   exp: string,            user edits on profile page
 *   portfolio: string,      user edits on profile page
 *   bio: string,            user edits on profile page
 *   avatarUrl: string|null,
 *   degree: string,         from EducationDetails
 *   university: string,     from EducationDetails
 *   passingYear: string,    from EducationDetails
 *   engagement: string,     from CareerPreferences
 *   industries: string[],   from CareerPreferences
 *   skills: { id,name,level,pct }[],  from SkillsSection (+ profile edits)
 *   certs: { id,name,issuer,year,icon,color,url }[],
 *   resume: { name,date,url }|null,
 *   views: { candidates: number, recruiters: number },
 * }
 *
 * AUTH (PROVAHIRE_USER key):
 * { fullName, email, token, role }
 */

const PROFILE_KEY = 'PROVAHIRE_PROFILE';
const AUTH_KEY = 'PROVAHIRE_USER';

// ── Auth helpers ──────────────────────────────────────────────
export interface AuthUser {
    fullName: string;
    email: string;
    token: string;
    role: string;
    _id?: string;
}

export function getAuthUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function setAuthUser(user: AuthUser) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

// ── Profile helpers ───────────────────────────────────────────
export interface StoredProfile {
    name: string;
    title: string;
    location: string;
    email: string;
    exp: string;
    portfolio: string;
    bio: string;
    avatarUrl: string | null;
    degree: string;
    university: string;
    passingYear: string;
    engagement: string;
    industries: string[];
    skills: { id: number; name: string; level: string; pct: number }[];
    certs: { id: number; name: string; issuer: string; year: string; icon: string; color: string; url: string }[];
    resume: { name: string; date: string; url: string } | null;
    views: { candidates: number; recruiters: number };
    onboardingDone: boolean;
    subscriptionTier: 'Free' | 'Basic' | 'Pro' | 'Elite';
    skillScore: number | null;
    resumeScore: number | null;
    testScore: number | null;
    hireScore: number | null;
    jobProfileMatch: string | null;
    targetRole?: string;
    verifiedSkills: { id: number; name: string; level: string; pct: number }[];
}

const emptyProfile = (): StoredProfile => ({
    name: '',
    title: '',
    location: '',
    email: '',
    exp: '',
    portfolio: '',
    bio: '',
    avatarUrl: null,
    degree: '',
    university: '',
    passingYear: '',
    engagement: 'job',
    industries: [],
    skills: [],
    certs: [],
    resume: null,
    views: { candidates: 0, recruiters: 0 },
    onboardingDone: false,
    subscriptionTier: 'Free',
    skillScore: null,
    resumeScore: null,
    testScore: null,
    hireScore: null,
    jobProfileMatch: null,
    verifiedSkills: [],
});

export function getProfile(): StoredProfile {
    try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (!raw) return emptyProfile();
        return { ...emptyProfile(), ...JSON.parse(raw) };
    } catch { return emptyProfile(); }
}

export function saveProfile(updates: Partial<StoredProfile>) {
    const current = getProfile();
    const merged = { ...current, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    return merged;
}

/** Merge auth user's name+email into stored profile on first login */
export function hydrateProfileFromAuth() {
    const user = getAuthUser();
    if (!user) return;
    const profile = getProfile();
    const updates: Partial<StoredProfile> = {};
    if (!profile.name && user.fullName) updates.name = user.fullName;
    if (!profile.email && user.email) updates.email = user.email;
    if (Object.keys(updates).length) saveProfile(updates);
}

/** Increment view count (for demo — in prod this would be a backend call) */
export function incrementViews(type: 'candidates' | 'recruiters') {
    const profile = getProfile();
    saveProfile({
        views: {
            ...profile.views,
            [type]: profile.views[type] + 1,
        }
    });
}
