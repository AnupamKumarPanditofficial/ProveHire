export type EventCategory = 'Hackathons' | 'Webinars' | 'Meetups' | 'Workshops' | 'Other';

export interface TechEvent {
    _id: string;
    id?: string; // Keep optional for transition if needed
    heading: string;
    subtitle: string;
    imageUrl: string;
    body: string;
    link: string;
    deadline: string;
    category: EventCategory;
    createdAt: string;
}

import { API_BASE_URL } from '../globalConfig';
const API_BASE = `${API_BASE_URL}/api/events`;

export async function getEvents(): Promise<TechEvent[]> {
    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to fetch events');
        return await res.json();
    } catch (err) {
        console.error('Fetch events error:', err);
        return [];
    }
}

// saveEvent and deleteEvent are no longer needed here as they are handled via AdminDashboard calling the backend directly.
// We keep the types for use across the frontend.
