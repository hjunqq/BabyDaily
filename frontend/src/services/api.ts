import {
    type AuthSession,
    type Baby,
    type BabyRecord,
    type Family,
    type FeedTimelineData,
    type NotificationItem,
    type User,
    type UserSettings,
} from '../types';
import { API_URL } from '../config/env';

let ACCESS_TOKEN = localStorage.getItem('access_token');
let CURRENT_BABY_ID: string | null = localStorage.getItem('current_baby_id');
let CURRENT_FAMILY_ID: string | null = localStorage.getItem('current_family_id');
let CURRENT_USER: User | null = localStorage.getItem('current_user')
    ? JSON.parse(localStorage.getItem('current_user') as string)
    : null;
let CURRENT_BABY: Baby | null = localStorage.getItem('current_baby')
    ? JSON.parse(localStorage.getItem('current_baby') as string)
    : null;
let CURRENT_FAMILY: Family | null = localStorage.getItem('current_family')
    ? JSON.parse(localStorage.getItem('current_family') as string)
    : null;

const ENABLE_DEV_LOGIN = String((import.meta as any).env?.VITE_ENABLE_DEV_LOGIN || '').trim() === 'true';
const ACCESS_PIN = String((import.meta as any).env?.VITE_ACCESS_PIN || '').trim();
const LEGACY_BABY_PLACEHOLDER = 'u-sakura-001';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    ...(ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {}),
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
});

const clearStoredSession = () => {
    ACCESS_TOKEN = null;
    CURRENT_BABY_ID = null;
    CURRENT_FAMILY_ID = null;
    CURRENT_USER = null;
    CURRENT_BABY = null;
    CURRENT_FAMILY = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_baby_id');
    localStorage.removeItem('current_family_id');
    localStorage.removeItem('current_user');
    localStorage.removeItem('current_baby');
    localStorage.removeItem('current_family');
};

const normalizeFamily = (family: any): Family | null => {
    if (!family) return null;
    return {
        id: family.id,
        name: family.name,
        creatorId: family.creator_id || family.creatorId,
    };
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
    const mapped = {
        ...baby,
        familyId: baby.family_id || baby.familyId,
        avatarUrl: baby.avatar_url || baby.avatarUrl,
        bloodType: baby.blood_type || baby.bloodType,
    };
    if (!mapped.avatarUrl) {
        mapped.avatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura&backgroundColor=ffb7c5';
    }
    return mapped;
};

const persistSession = (data: any): AuthSession => {
    ACCESS_TOKEN = data.access_token || ACCESS_TOKEN;
    if (ACCESS_TOKEN) {
        localStorage.setItem('access_token', ACCESS_TOKEN);
    }

    CURRENT_USER = data.user || null;
    if (CURRENT_USER) {
        localStorage.setItem('current_user', JSON.stringify(CURRENT_USER));
    } else {
        localStorage.removeItem('current_user');
    }

    CURRENT_FAMILY = normalizeFamily(data.family);
    CURRENT_FAMILY_ID = CURRENT_FAMILY?.id || null;
    if (CURRENT_FAMILY) {
        localStorage.setItem('current_family', JSON.stringify(CURRENT_FAMILY));
        localStorage.setItem('current_family_id', CURRENT_FAMILY.id);
    } else {
        localStorage.removeItem('current_family');
        localStorage.removeItem('current_family_id');
    }

    CURRENT_BABY = data.baby ? mapBabyResponse(data.baby) : null;
    CURRENT_BABY_ID = CURRENT_BABY?.id || null;
    if (CURRENT_BABY) {
        localStorage.setItem('current_baby', JSON.stringify(CURRENT_BABY));
        localStorage.setItem('current_baby_id', CURRENT_BABY.id);
    } else {
        localStorage.removeItem('current_baby');
        localStorage.removeItem('current_baby_id');
    }

    return {
        accessToken: ACCESS_TOKEN || '',
        user: CURRENT_USER as User,
        family: CURRENT_FAMILY,
        baby: CURRENT_BABY,
        onboardingRequired: !!data.onboardingRequired,
    };
};

const requireCurrentBaby = async (): Promise<Baby> => {
    if (CURRENT_BABY) {
        return CURRENT_BABY;
    }

    const session = await BabyService.bootstrap();
    if (!session.baby) {
        throw new Error('ONBOARDING_REQUIRED');
    }
    return session.baby;
};

const resolveTargetBabyId = async (babyId?: string | null): Promise<string> => {
    if (babyId && babyId !== LEGACY_BABY_PLACEHOLDER) {
        return babyId;
    }

    const baby = await requireCurrentBaby();
    return baby.id;
};

export const request = async (url: string, options: RequestInit = {}) => {
    let res = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers: { ...getHeaders(), ...options.headers },
    });

    if (res.status === 401 || res.status === 400) {
        console.warn(`Request to ${url} failed with ${res.status}, attempting re-bootstrap...`);
        try {
            await BabyService.bootstrap();
            res = await fetch(url, {
                ...options,
                cache: 'no-store',
                headers: { ...getHeaders(), ...options.headers },
            });
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
    } catch {
        return {};
    }
};

export const BabyService = {
    bootstrap: async (): Promise<AuthSession> => {
        try {
            // If we already have a token, just refresh the session
            // (preserves admin login instead of re-authenticating with PIN)
            if (ACCESS_TOKEN) {
                return BabyService.refreshSession();
            }

            const body = ENABLE_DEV_LOGIN
                ? { method: 'dev' }
                : ACCESS_PIN
                    ? { method: 'pin', pin: ACCESS_PIN }
                    : null;

            if (!body) {
                throw new Error('No login method configured');
            }

            const res = await fetch(`${API_URL}/auth/bootstrap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                throw new Error('Bootstrap failed');
            }

            const data = await res.json();
            return persistSession(data);
        } catch (error) {
            console.error('Bootstrap failed:', error);
            clearStoredSession();
            throw error;
        }
    },

    loginDev: async () => {
        return BabyService.bootstrap();
    },

    loginAdmin: async (username: string, password: string): Promise<AuthSession> => {
        const res = await fetch(`${API_URL}/auth/bootstrap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method: 'admin', username, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || '管理员登录失败');
        }
        const data = await res.json();
        return persistSession(data);
    },

    refreshSession: async (): Promise<AuthSession> => {
        if (!ACCESS_TOKEN) {
            return BabyService.bootstrap();
        }

        const res = await fetch(`${API_URL}/auth/session`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) {
            clearStoredSession();
            throw new Error('Session refresh failed');
        }

        const data = await res.json();
        return persistSession(data);
    },

    ensureDevEnvironment: async (): Promise<Baby> => {
        return requireCurrentBaby();
    },

    getCurrentBabyId: () => CURRENT_BABY_ID,
    getCurrentFamilyId: () => CURRENT_FAMILY_ID,
    getCurrentUser: () => CURRENT_USER,
    getCurrentBaby: () => CURRENT_BABY,
    getCurrentFamily: () => CURRENT_FAMILY,
    isAuthenticated: () => !!ACCESS_TOKEN,

    logout: () => {
        clearStoredSession();
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

    createFamily: async (name: string): Promise<Family> => {
        return request(`${API_URL}/families`, {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    },

    // ─── Family Management ─────────────────────────────────
    createInvite: async (familyId: string, role: string = 'MEMBER'): Promise<any> => {
        return request(`${API_URL}/families/${familyId}/invites`, {
            method: 'POST',
            body: JSON.stringify({ role }),
        });
    },

    getMembers: async (familyId: string): Promise<any[]> => {
        return request(`${API_URL}/families/${familyId}/members`);
    },

    getPendingMembers: async (familyId: string): Promise<any[]> => {
        return request(`${API_URL}/families/${familyId}/members/pending`);
    },

    approveMember: async (familyId: string, memberId: string): Promise<any> => {
        return request(`${API_URL}/families/${familyId}/members/${memberId}/approve`, {
            method: 'POST',
        });
    },

    rejectMember: async (familyId: string, memberId: string): Promise<any> => {
        return request(`${API_URL}/families/${familyId}/members/${memberId}/reject`, {
            method: 'POST',
        });
    },

    updateMemberRole: async (familyId: string, memberId: string, role: string): Promise<any> => {
        return request(`${API_URL}/families/${familyId}/members/${memberId}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        });
    },

    removeMember: async (familyId: string, memberId: string): Promise<void> => {
        return request(`${API_URL}/families/${familyId}/members/${memberId}`, {
            method: 'DELETE',
        });
    },

    getBabiesByFamily: async (familyId: string): Promise<Baby[]> => {
        const babies = await request(`${API_URL}/babies/family/${familyId}`);
        return babies.map(mapBabyResponse);
    },

    createBaby: async (data: { family_id: string; name: string; gender: 'MALE' | 'FEMALE'; birthday: string; avatar_url?: string }): Promise<Baby> => {
        const baby = await request(`${API_URL}/babies`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const mapped = mapBabyResponse(baby);
        CURRENT_BABY = mapped;
        CURRENT_BABY_ID = mapped.id;
        localStorage.setItem('current_baby', JSON.stringify(mapped));
        localStorage.setItem('current_baby_id', mapped.id);
        return mapped;
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
            body: JSON.stringify(userToCamelCase(data)),
        });
        return mapBabyResponse(baby);
    },

    uploadAvatar: async (babyId: string, file: File): Promise<Baby> => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/babies/${babyId}/avatar`, {
            method: 'POST',
            headers: ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {},
            body: formData,
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

    getRecords: async (babyId: string, limit = 50, offset = 0): Promise<BabyRecord[]> => {
        const targetId = await resolveTargetBabyId(babyId);
        return request(`${API_URL}/records/baby/${targetId}?limit=${limit}&offset=${offset}`);
    },

    createRecord: async (record: Partial<BabyRecord>): Promise<BabyRecord> => {
        const targetBabyId = await resolveTargetBabyId(record.babyId || null);
        return request(`${API_URL}/records`, {
            method: 'POST',
            body: JSON.stringify({ ...record, babyId: targetBabyId }),
        });
    },

    updateRecord: async (id: string, updates: Partial<BabyRecord>): Promise<BabyRecord> => {
        const babyId = await resolveTargetBabyId(updates.babyId || null);
        return request(`${API_URL}/records/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...updates, babyId }),
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
            body: JSON.stringify({ ids }),
        });
    },

    getRecord: async (id: string): Promise<BabyRecord> => {
        return request(`${API_URL}/records/${id}`);
    },

    importRecords: async (babyId: string, records: any[]): Promise<{ count: number }> => {
        return request(`${API_URL}/records/baby/${babyId}/import`, {
            method: 'POST',
            body: JSON.stringify({ records }),
        });
    },

    getSummary: async (babyId: string, days = 1) => {
        const targetId = await resolveTargetBabyId(babyId);
        return request(`${API_URL}/records/baby/${targetId}/summary?days=${days}`);
    },

    getTrends: async (babyId: string, days = 7) => {
        const targetId = await resolveTargetBabyId(babyId);
        return request(`${API_URL}/records/baby/${targetId}/trend?days=${days}`);
    },

    getFeedTimeline: async (babyId: string, dayStartHour = 0): Promise<FeedTimelineData> => {
        const targetId = await resolveTargetBabyId(babyId);
        return request(`${API_URL}/records/baby/${targetId}/feed-timeline?dayStartHour=${dayStartHour}`);
    },

    getKindleSummary: async (babyId?: string) => {
        const targetId = await resolveTargetBabyId(babyId || null);
        return request(`${API_URL}/records/baby/${targetId}/kindle-summary`);
    },
};
