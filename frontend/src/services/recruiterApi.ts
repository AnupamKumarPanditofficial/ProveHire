import { getAuthUser } from '../utils/profileStore';
import { API_BASE_URL } from '../globalConfig';

const API_BASE = API_BASE_URL;

// ─── Auth Token ───────────────────────────────────────────────────────────────
const getToken = (): string | null => {
    const user = getAuthUser();
    return user?.token || null;
};

// ─── Base Fetch ───────────────────────────────────────────────────────────────
async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AIWeights {
    skillScore: number;
    resumeScore: number;
    hireScore: number;
}

export interface JobPipeline {
    applied: number;
    shortlisted: number;
    interview: number;
    hired: number;
    rejected: number;
}

export interface DailyCount {
    day: string;
    count: number;
}

export interface Job {
    _id: string;
    recruiter: string;
    title: string;
    department: string;
    location: string;
    employmentType: string;
    experienceRange: string;
    description: string;
    skills: string[];
    status: 'Active' | 'Closed' | 'Draft';
    aiWeights: AIWeights;
    lastDateToApply: string | null;
    postedAt: string | null;
    createdAt: string;
    updatedAt: string;
    // Enriched by backend
    pipeline: JobPipeline;
    totalApplicants: number;
    dailyChart: DailyCount[];
}

export interface DashboardStats {
    totalJobPosts: number;
    activeJobs: number;
    totalApplicants: number;
    shortlisted: number;
    interviewsScheduled: number;
    oaSent: number;
    totalHired: number;
    totalRejected: number;
}

export interface StatusBreakdown {
    name: string;
    value: number;
}

export interface HiredVsRejected {
    role: string;
    hired: number;
    rejected: number;
}

export interface DailyApplications {
    date: string;
    count: number;
}

export interface DashboardResponse {
    stats: DashboardStats;
    applicantStatusBreakdown: StatusBreakdown[];
    dailyApplications: DailyApplications[];
    hiredVsRejected: HiredVsRejected[];
}

export interface RecruiterProfile {
    _id: string;
    fullName: string;
    email: string;
    company: string;
    companyWebsite: string;
    companyEmail: string;
    industryType: string;
    companySize: string;
    companyLocation: string;
    companyLogo: string;
    designation: string;
    phone: string;
    linkedIn: string;
    workEmail: string;
    profilePic: string; // URL or Base64
    hiringRoles: string[];
    jobType: string[];
    workMode: string[];
    experienceLevel: string;
    monthlyVolume: string;
    aiAutoScreening: boolean;
    role: string;
    onboardingDone: boolean;
}

export interface JobsResponse {
    jobs: Job[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateJobPayload {
    title: string;
    department: string;
    location: string;
    employmentType?: string;
    experienceRange?: string;
    description: string;
    skills?: string[];
    status?: 'Active' | 'Draft';
    aiWeights?: AIWeights;
    lastDateToApply?: string | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────
export const getDashboardStats = (): Promise<DashboardResponse> =>
    apiFetch('/api/recruiter/dashboard/stats');

export const getJobs = (params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<JobsResponse> => {
    const qs = params ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
    ).toString() : '';
    return apiFetch(`/api/recruiter/jobs${qs}`);
};

export const createJob = (data: CreateJobPayload): Promise<{ message: string; job: Job }> =>
    apiFetch('/api/recruiter/jobs', { method: 'POST', body: JSON.stringify(data) });

export const updateJob = (id: string, data: Partial<CreateJobPayload & { status: string }>): Promise<{ message: string; job: Job }> =>
    apiFetch(`/api/recruiter/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteJob = (id: string): Promise<{ message: string }> =>
    apiFetch(`/api/recruiter/jobs/${id}`, { method: 'DELETE' });

export const getAllApplicants = (): Promise<{ applications: unknown[] }> =>
    apiFetch('/api/recruiter/applicants');

export const getProfile = (): Promise<RecruiterProfile> =>
    apiFetch('/api/recruiter-auth/me');

export const updateProfile = (data: Partial<RecruiterProfile>): Promise<{ message: string; recruiter: Partial<RecruiterProfile> }> =>
    apiFetch('/api/recruiter-auth/profile', { method: 'PATCH', body: JSON.stringify(data) });

export const getPublicEvents = (): Promise<any[]> =>
    apiFetch('/api/events');
