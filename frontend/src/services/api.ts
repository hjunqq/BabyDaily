import { type Baby, type BabyRecord, type Family, type User, type UserSettings, type NotificationItem } from '../types';
import { API_URL } from '../config/env';
let ACCESS_TOKEN = localStorage.getItem('access_token');
let CURRENT_BABY_ID: string | null = localStorage.getItem('current_baby_id');
let CURRENT_USER: User | null = localStorage.getItem('current_user')
    ? JSON.parse(localStorage.getItem('current_user') as string)
    : null;

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ACCESS_TOKEN}`
});

export const BabyService = {
    // Auth & Init
    loginDev: async () => {
        try {
            const res = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
            if (!res.ok) throw new Error('登录失败');
            const data = await res.json();
            ACCESS_TOKEN = data.access_token;
            if (ACCESS_TOKEN) localStorage.setItem('access_token', ACCESS_TOKEN);
            if (data.user) {
                CURRENT_USER = data.user;
                localStorage.setItem('current_user', JSON.stringify(data.user));
            }
            return data.user as User;
        } catch (error) {
            console.error('Dev login failed:', error);
            throw error;
        }
    },

    ensureDevEnvironment: async (): Promise<Baby> => {
        try {
            if (!ACCESS_TOKEN) await BabyService.loginDev();

            // 1. Get Families
            let res = await fetch(`${API_URL}/families/my`, { headers: getHeaders() });
            if (res.status === 401) {
                // Token invalid? Retry login
                await BabyService.loginDev();
                res = await fetch(`${API_URL}/families/my`, { headers: getHeaders() });
            }

            let families = await res.json();
            let familyId;

            if (!Array.isArray(families) || families.length === 0) {
                // Create default family
                res = await fetch(`${API_URL}/families`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ name: '樱花的家' })
                });
                const family = await res.json();
                familyId = family.id;
            } else {
                familyId = families[0].id;
            }

            // 2. Get Babies
            res = await fetch(`${API_URL}/babies/family/${familyId}`, { headers: getHeaders() });
            let babies = await res.json();

            let baby;
            if (!Array.isArray(babies) || babies.length === 0) {
                // Create default baby
                res = await fetch(`${API_URL}/babies`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        family_id: familyId,
                        name: '樱花',
                        gender: 'FEMALE',
                        birthday: new Date().toISOString()
                    })
                });
                baby = await res.json();
            } else {
                baby = babies[0];
            }

            CURRENT_BABY_ID = baby.id;
            localStorage.setItem('current_baby_id', baby.id);

            return {
                ...baby,
                avatar_url: baby.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sakura&backgroundColor=ffb7c5'
            } as Baby;
        } catch (error) {
            console.error('Environment setup failed:', error);
            throw error;
        }
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
        const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取用户信息失败');
        const user = await res.json();
        CURRENT_USER = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
    },

    updateMe: async (data: Partial<User>): Promise<User> => {
        const res = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('更新用户信息失败');
        const user = await res.json();
        CURRENT_USER = user;
        localStorage.setItem('current_user', JSON.stringify(user));
        return user;
    },

    getFamilies: async (): Promise<Family[]> => {
        const res = await fetch(`${API_URL}/families/my`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取家庭失败');
        return await res.json();
    },

    getBabiesByFamily: async (familyId: string): Promise<Baby[]> => {
        const res = await fetch(`${API_URL}/babies/family/${familyId}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取宝宝列表失败');
        return await res.json();
    },

    getBabyById: async (id: string): Promise<Baby> => {
        const res = await fetch(`${API_URL}/babies/${id}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取宝宝信息失败');
        return await res.json();
    },

    getBabyProfile: async (id: string): Promise<Baby> => {
        return BabyService.getBabyById(id);
    },

    getSettings: async (): Promise<UserSettings> => {
        const res = await fetch(`${API_URL}/settings`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取设置失败');
        return await res.json();
    },

    updateSettings: async (data: Partial<UserSettings>): Promise<UserSettings> => {
        const res = await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('更新设置失败');
        return await res.json();
    },

    getNotifications: async (limit = 20, offset = 0): Promise<NotificationItem[]> => {
        const res = await fetch(`${API_URL}/notifications?limit=${limit}&offset=${offset}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取通知失败');
        return await res.json();
    },

    markNotificationRead: async (id: string): Promise<NotificationItem> => {
        const res = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('更新通知状态失败');
        return await res.json();
    },

    // Records
    getRecords: async (babyId: string, limit = 50, offset = 0): Promise<BabyRecord[]> => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;

        const res = await fetch(`${API_URL}/records/baby/${targetId}?limit=${limit}&offset=${offset}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('获取记录失败');
        return await res.json();
    },

    createRecord: async (record: Partial<BabyRecord>): Promise<BabyRecord> => {
        const envBabyId = CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id;
        const targetBabyId = record.baby_id && record.baby_id !== 'u-sakura-001' ? record.baby_id : envBabyId;

        const res = await fetch(`${API_URL}/records`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ...record, baby_id: targetBabyId })
        });
        if (!res.ok) throw new Error('创建记录失败');
        return await res.json();
    },

    updateRecord: async (id: string, updates: Partial<BabyRecord>): Promise<BabyRecord> => {
        const res = await fetch(`${API_URL}/records/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('更新记录失败');
        return await res.json();
    },

    deleteRecord: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/records/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('删除记录失败');
    },

    getRecord: async (id: string): Promise<BabyRecord> => {
        const res = await fetch(`${API_URL}/records/${id}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('获取记录详情失败');
        return await res.json();
    },

    // Summary
    getSummary: async (babyId: string, days = 1) => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        const res = await fetch(`${API_URL}/records/baby/${targetId}/summary?days=${days}`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`获取统计失败: ${res.status} ${res.statusText}`);
        return await res.json();
    },

    // Trend
    getTrends: async (babyId: string, days = 7) => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        const res = await fetch(`${API_URL}/records/baby/${targetId}/trend?days=${days}`, { headers: getHeaders() });
        if (!res.ok) throw new Error(`获取趋势失败: ${res.status} ${res.statusText}`);
        return await res.json();
    }
};
