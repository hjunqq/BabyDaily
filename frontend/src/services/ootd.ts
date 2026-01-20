import { API_URL } from '../config/env';

export interface OotdItem {
    id: string;
    baby_id: string;
    image_url: string;
    thumbnail_url?: string;
    tags: string[];
    date: string;
    likes: number;
    created_at: string;
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
});

export const OotdService = {
    // 获取 OOTD 列表
    getOotdList: async (babyId: string, page = 1, limit = 20, tags?: string[]): Promise<OotdItem[]> => {
        try {
            const tagsParam = tags && tags.length > 0 ? `&tags=${tags.join(',')}` : '';
            const res = await fetch(
                `${API_URL}/ootd/baby/${babyId}?page=${page}&limit=${limit}${tagsParam}`,
                { headers: getHeaders() }
            );
            if (!res.ok) throw new Error('Failed to fetch OOTD list');
            return await res.json();
        } catch (error) {
            console.error('Failed to fetch OOTD:', error);
            return [];
        }
    },

    // 点赞
    likeOotd: async (id: string): Promise<OotdItem> => {
        const res = await fetch(`${API_URL}/ootd/${id}/like`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to like OOTD');
        return await res.json();
    },

    // 创建 OOTD（简化版，实际需要文件上传）
    createOotd: async (data: Partial<OotdItem>): Promise<OotdItem> => {
        const res = await fetch(`${API_URL}/ootd`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create OOTD');
        return await res.json();
    },

    // 上传 OOTD 图片
    uploadOotd: async (payload: { baby_id: string; files: FileList; tags?: string[]; date?: string }): Promise<OotdItem> => {
        const form = new FormData();
        form.append('baby_id', payload.baby_id);
        form.append('date', payload.date || new Date().toISOString().slice(0, 10));
        if (payload.tags?.length) form.append('tags', payload.tags.join(','));
        Array.from(payload.files).forEach((file) => form.append('files', file));

        const res = await fetch(`${API_URL}/ootd/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: form,
        });
        if (!res.ok) throw new Error('Failed to upload OOTD');
        return await res.json();
    },

    // 删除 OOTD
    deleteOotd: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/ootd/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete OOTD');
    },
};
