import { type Baby, type BabyRecord } from '../types';

const API_URL = 'http://localhost:3000';
let ACCESS_TOKEN = localStorage.getItem('access_token');
let CURRENT_BABY_ID: string | null = localStorage.getItem('current_baby_id');
let CURRENT_USER = localStorage.getItem('current_user')
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
            if (!res.ok) throw new Error('Login failed');
            const data = await res.json();
            ACCESS_TOKEN = data.access_token;
            if (ACCESS_TOKEN) localStorage.setItem('access_token', ACCESS_TOKEN);
            if (data.user) {
                CURRENT_USER = data.user;
                localStorage.setItem('current_user', JSON.stringify(data.user));
            }
            return data.user;
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
                    body: JSON.stringify({ name: "Sakura's Family" })
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
                        name: 'Sakura',
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
            // Fallback for UI testing if backend is dead
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

    getBabyProfile: async (_id: string): Promise<Baby> => {
        // Ignroe ID, return current env baby
        return BabyService.ensureDevEnvironment();
    },

    // Records
    getRecords: async (babyId: string, limit = 50): Promise<BabyRecord[]> => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;

        const res = await fetch(`${API_URL}/records/baby/${targetId}?limit=${limit}`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch records');
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
        if (!res.ok) throw new Error('Failed to create record');
        return await res.json();
    },

    updateRecord: async (id: string, updates: Partial<BabyRecord>): Promise<BabyRecord> => {
        const res = await fetch(`${API_URL}/records/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update record');
        return await res.json();
    },

    deleteRecord: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/records/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete record');
    },

    getRecord: async (id: string): Promise<BabyRecord> => {
        const res = await fetch(`${API_URL}/records/${id}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to get record');
        return await res.json();
    },

    // Summary
    getSummary: async (babyId: string) => {
        const targetId = babyId === 'u-sakura-001' ? (CURRENT_BABY_ID || (await BabyService.ensureDevEnvironment()).id) : babyId;
        const res = await fetch(`${API_URL}/records/baby/${targetId}/summary`, { headers: getHeaders() });
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
