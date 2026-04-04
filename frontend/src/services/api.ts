import { type Baby, type BabyRecord, type Family, type User, type UserSettings, type NotificationItem, type FeedTimelineData } from '../types';
import { API_URL } from '../config/env';
let ACCESS_TOKEN = localStorage.getItem('access_token');
let CURRENT_BABY_ID: string | null = localStorage.getItem('current_baby_id');
let CURRENT_USER: User | null = localStorage.getItem('current_user')
    ? JSON.parse(localStorage.getItem('current_user') as string)
    : null;
const DEV_LOGIN_ENABLED = String((import.meta as any).env?.VITE_ENABLE_DEV_LOGIN || 'true').trim() === 'true';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
});

export const request = async (url: string, options: RequestInit = {}) => {
    let res = await fetch(url, { ...options, cache: 'no-store', headers: { ...getHeaders(), ...options.headers } });

    // If unauthorized or bad request (likely stale state), try re-bootstrap once.
    if (res.status === 401 || res.status === 400) {
        console.warn(`Request to ${url} failed with ${res.status}, attempting re-bootstrap...`);
        try {
            await BabyService.bootstrap();
            res = await fetch(url, { ...options, cache: 'no-store', headers: { ...getHeaders(), ...options.headers } });
        } catch (loginError) {
            console.error('Re-bootstrap failed during request retry:', loginError);
            BabyService.logout();
            throw loginError;
        }
    }

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${res.status}`);
    }

    if (res.status === 204) {
        return {};
    }

    try {
        return await res.json();
    } catch (e) {
        return {}; // Handle empty or invalid JSON response
    }
};

export const BabyService = {
    // Auth & Init — single bootstrap call handles login + family + baby
    bootstrap: async (): Promise<Baby> => {
        try {
            const res = await fetch(`${API_URL}/auth/bootstrap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'dev' }),
            });
            if (!res.ok) throw new Error('Bootstrap failed');
            const data = await res.json();

            ACCESS_TOKEN = data.access_token;
            if (ACCESS_TOKEN) localStorage.setItem('access_token', ACCESS_TOKEN);

            if (data.user) {
                CURRENT_USER = data.user;
                localStorage.setItem('current_user', JSON.stringify(data.user));
            }

            CURRENT_BABY_ID = data.baby.id;
            localStorage.setItem('current_baby_id', data.baby.id);

            if (!data.baby.avatar_url) {
                data.baby.avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura&backgroundColor=ffb7c5';
            }

            return mapBabyResponse(data.baby);
        } catch (error) {
            console.error('Bootstrap failed:', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('current_baby_id');
            throw error;
        }
    },

    // Keep loginDev for backward compatibility (used by request retry)
    loginDev: async () => {
        return BabyService.bootstrap();
    },

    // Alias for backward compatibility
    ensureDevEnvironment: async (): Promise<Baby> => {
        return BabyService.bootstrap();
    },

    getCurrentBabyId: () => CURRENT_BABY_ID,

    getCurrentUser: () => CURRENT_USER,

    isAuthenticated: () => !!ACCESS_TOKEN,

    logout: () => {
        ACCESS_TOKEN = null;
        CURRENT_BABY_ID = null;
        CURRENT_USER = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_baby_id');
        localStorage.removeItem('current_user');
    },

    getMe: async (): Promise<User> => {
        const user = await request(`${API_URL}/users/me`);
        CURRENT_USER = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
    },

    updateMe: async (data: Partial<User>): Promise<User> => {
        const user = await request(`${API_URL}/users/me`, {
            method: 'PATCH',
            body: JSON.stringify(userToCamelCase(data)),
        });
        CURRENT_USER = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
    },

    getFamilies: async (): Promise<Family[]> => {
        return request(`${API_URL}/families/my`);
    },

    getBabiesByFamily: async (familyId: string): Promise<Baby[]> => {
        const babies = await request(`${API_URL}/babies/family/${familyId}`);
        return babies.map(mapBabyResponse);
    },

    getBabyById: async (id: string): Promise<Baby> => {
        const baby = await request(`${API_URL}/babies/${id}`);
        return mapBabyResponse(baby);
    },

    getBabyProfile: async (id: string): Promise<Baby> => {
        const baby = await request(`${API_URL}/babies/${id}`);
        return mapBabyResponse(baby);
    },

    updateBaby: async (id: string, data: Partial<Baby>): Promise<Baby> => {
        const baby = await request(`${API_URL}/babies/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(userToCamelCase(data))
        });
        return mapBabyResponse(baby);
    },

    uploadAvatar: async (babyId: string, file: File): Promise<Baby> => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/babies/${babyId}/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            throw new Error('Avatar upload failed');
        }
        const baby = await res.json();
        return mapBabyResponse(baby);
    },

    getSettings: async (): Promise<UserSettings> => {
        return request(`${API_URL}/settings`);
    },

    updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
        return request(`${API_URL}/settings`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    getNotifications: async (limit = 20, offset = 0): Promise<NotificationItem[]> => {
        return request(`${API_URL}/notifications?limit=${limit}&offset=${offset}`);
    },

    markNotificationRead: async (id: string): Promise<NotificationItem> => {
        return request(`${API_URL}/notifications/${id}/read`, {
            method: 'POST',
        });
    },

    // Records
    getRecords: async (babyId: string, limit = 50, offset = 0): Promise<BabyRecord[]> => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        return request(`${API_URL}/records/baby/${targetId}?limit=${limit}&offset=${offset}`);
    },

    createRecord: async (record: Partial<BabyRecord>): Promise<BabyRecord> => {
        const envBabyId = CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id;
        const targetBabyId = record.babyId && record.babyId !== 'u-sakura-001' ? record.babyId : envBabyId;

        return request(`${API_URL}/records`, {
            method: 'POST',
            body: JSON.stringify({ ...record, babyId: targetBabyId })
        });
    },

    updateRecord: async (id: string, updates: Partial<BabyRecord>): Promise<BabyRecord> => {
        const babyId = CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id;
        return request(`${API_URL}/records/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...updates, babyId })
        });
    },

    deleteRecord: async (id: string): Promise<void> => {
        await request(`${API_URL}/records/${id}`, {
            method: 'DELETE',
        });
    },

    deleteAllRecords: async (babyId: string): Promise<void> => {
        await request(`${API_URL}/records/baby/${babyId}/all`, {
            method: 'DELETE',
        });
    },

    deleteRecords: async (ids: string[]): Promise<void> => {
        await request(`${API_URL}/records/batch`, {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    },

    getRecord: async (id: string): Promise<BabyRecord> => {
        return request(`${API_URL}/records/${id}`);
    },

    importRecords: async (babyId: string, records: any[]): Promise<{ count: number }> => {
        return request(`${API_URL}/records/baby/${babyId}/import`, {
            method: 'POST',
            body: JSON.stringify({ records })
        });
    },

    // Summary
    getSummary: async (babyId: string, days = 1) => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        return request(`${API_URL}/records/baby/${targetId}/summary?days=${days}`);
    },

    getTrends: async (babyId: string, days = 7) => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        return request(`${API_URL}/records/baby/${targetId}/trend?days=${days}`);
    },

    getFeedTimeline: async (babyId: string, dayStartHour = 0): Promise<FeedTimelineData> => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        return request(`${API_URL}/records/baby/${targetId}/feed-timeline?dayStartHour=${dayStartHour}`);
    },

    getKindleSummary: async (babyId?: string) => {
        const targetId = babyId || CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id;
        return request(`${API_URL}/records/baby/${targetId}/kindle-summary`);
    }
};

const userToCamelCase = (data: any) => {
    const mapped: any = { ...data };
    if (mapped.avatar_url) {
        mapped.avatarUrl = mapped.avatar_url;
        delete mapped.avatar_url;
    }
    return mapped;
};

const mapBabyResponse = (baby: any): Baby => {
    if (!baby) return baby;
    return {
        ...baby,
        familyId: baby.family_id || baby.familyId,
        avatarUrl: baby.avatar_url || baby.avatarUrl,
        bloodType: baby.blood_type || baby.bloodType,
        // Ensure camelCase for other fields if needed, but these are the main ones varying
    };
};
