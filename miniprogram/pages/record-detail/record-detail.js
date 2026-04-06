const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        record: null,
        loading: true,
        error: '',
        fields: [],
    },

    onLoad(options) {
        this.recordId = options.id;
        const ready = app.readyPromise || Promise.resolve();
        ready.then(() => {
            if (!app.ensureBabyContext()) return;
            this.loadData();
        }).catch(() => {
            this.setData({ error: '加载失败', loading: false });
        });
    },

    async loadData() {
        this.setData({ loading: true, error: '' });
        try {
            const record = await authedRequest(`/records/${this.recordId}`);
            const fields = this.buildFields(record);
            this.setData({ record, fields, loading: false });
        } catch (err) {
            this.setData({ error: '加载记录失败', loading: false });
        }
    },

    buildFields(r) {
        const fields = [];
        fields.push({ label: '类型', value: this.mapType(r.type, (r.details || {}).subtype) });
        fields.push({ label: '时间', value: this.formatTime(r.time) });

        const d = r.details || {};
        if (r.type === 'FEED') {
            if (d.subtype === 'BREAST') {
                fields.push({ label: '亲喂时长', value: `${d.duration || 0} 分钟` });
            } else if (d.subtype === 'SOLID') {
                fields.push({ label: '辅食量', value: `${d.amount || 0} g` });
            } else {
                fields.push({ label: '奶量', value: `${d.amount || 0} ml` });
            }
        } else if (r.type === 'DIAPER') {
            const typeMap = { PEE: '尿尿', POO: '便便', BOTH: '尿尿 + 便便' };
            fields.push({ label: '类型', value: typeMap[d.type] || d.type });
        } else if (r.type === 'SLEEP') {
            const mins = d.duration || 0;
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            fields.push({ label: '时长', value: h > 0 ? `${h}小时${m > 0 ? m + '分钟' : ''}` : `${mins}分钟` });
        } else if (r.type === 'BATH') {
            fields.push({ label: '洗澡时长', value: d.duration ? `${d.duration} 分钟` : '未填写' });
        }

        if (r.remark) {
            fields.push({ label: '备注', value: r.remark });
        }
        return fields;
    },

    formatTime(str) {
        if (!str) return '';
        const d = new Date(str);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    },

    mapType(type, subtype) {
        if (type === 'FEED') {
            if (subtype === 'BREAST') return '亲喂';
            if (subtype === 'SOLID') return '辅食';
            return '瓶喂';
        }
        const map = { DIAPER: '换尿布', BATH: '洗澡', SLEEP: '睡眠', VITA_AD: '维生素 AD', VITA_D3: '维生素 D3' };
        return map[type] || '记录';
    },

    goToEdit() {
        wx.navigateTo({ url: `/pages/record-edit/record-edit?id=${this.recordId}` });
    },

    async deleteRecord() {
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条记录吗？',
            success: async (res) => {
                if (!res.confirm) return;
                try {
                    await authedRequest(`/records/${this.recordId}`, { method: 'DELETE' });
                    wx.showToast({ title: '已删除', icon: 'success' });
                    setTimeout(() => wx.navigateBack(), 600);
                } catch (err) {
                    wx.showToast({ title: '删除失败', icon: 'none' });
                }
            },
        });
    },
});
