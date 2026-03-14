export interface Notification {
    id: string;
    message: string;
    createdAt: string;
    read: boolean;
}

const NOTIFS_KEY = 'PROVAHIRE_NOTIFICATIONS';

export function getNotifications(): Notification[] {
    try {
        const raw = localStorage.getItem(NOTIFS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function addNotification(message: string): Notification {
    const notifs = getNotifications();
    const newNotif: Notification = {
        id: Date.now().toString(),
        message,
        createdAt: new Date().toISOString(),
        read: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));

    // Dispatch an event so components can re-render across tabs
    window.dispatchEvent(new Event('provahire_notifications_updated'));
    return newNotif;
}

export function markAsRead(id: string) {
    const notifs = getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('provahire_notifications_updated'));
}

export function markAllAsRead() {
    const notifs = getNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('provahire_notifications_updated'));
}
