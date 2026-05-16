const app = getApp();
const { authedRequest } = require('../../utils/api');
const { formatLocalDateTime } = require('../../utils/datetime');
const { recordTypeLabel, formatDuration } = require('../../utils/record-display');

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
        const d = r.details || {};
        fields.push({ label: '类型', value: recordTypeLabel(r.type, d.subtype) });
        fields.push({ label: '时间', value: formatLocalDateTime(r.time) });

        if (r.type === 'FEED') {
            if (d.subtype === 'BREAST') {
                fields.push({ label: '亲喂时长', value: `${d.duration || 0} 分钟` });
            } else if (d.subtype === 'SOLID') {
                fields.push({ label: '辅食量', value: `${d.amount || 0} g` });
            } else {
                fields.push({ label: '奶量', value: `${d.amount || 0} ml` });
            }
        } else if (r.type === 'DIAPER') {
            const typeMap = { PEE: '尿尿', POO: '便便', BOTH: '尿 + 便' };
            fields.push({ label: '类型', value: typeMap[d.type] || d.type });
        } else if (r.type === 'SLEEP') {
            fields.push({ label: '时长', value: formatDuration(d.duration) });
        } else if (r.type === 'BATH') {
            fields.push({ label: '洗澡时长', value: d.duration ? `${d.duration} 分钟` : '未填写' });
        } else if (r.type === 'TOPICAL') {
            fields.push({ label: '药膏', value: d.product || '—' });
            if (d.area) fields.push({ label: '部位', value: d.area });
        } else if (r.type === 'SOLIDS') {
            fields.push({ label: '辅食', value: d.food || '—' });
            if (d.amount) fields.push({ label: '分量', value: `${d.amount}${d.unit || 'g'}` });
        }

        if (r.remark) {
            fields.push({ label: '备注', value: r.remark });
        }
        return fields;
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
