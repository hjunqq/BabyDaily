const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        loading: true,
        saving: false,
        error: '',
        type: 'FEED',
        // FEED
        feedSubtype: 'BOTTLE',
        amount: 150,
        duration: 15,
        // DIAPER
        diaperType: 'PEE',
        // SLEEP
        sleepDuration: 60,
        // BATH
        bathDuration: 10,
        // TIME
        timeStr: '',
        remark: '',
        // presets
        feedPresets: [60, 80, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230],
        breastPresets: [5, 10, 15, 20, 25, 30],
        solidPresets: [30, 50, 80, 100, 120, 150],
        bathPresets: [5, 10, 15, 20, 30],
        sleepPresets: [30, 45, 60, 90, 120, 150, 180, 240],
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
        this.setData({ loading: true });
        try {
            const r = await authedRequest(`/records/${this.recordId}`);
            const d = r.details || {};
            const patch = {
                type: r.type,
                timeStr: r.time ? r.time.slice(0, 16).replace('T', ' ') : '',
                remark: r.remark || '',
                loading: false,
            };

            if (r.type === 'FEED') {
                patch.feedSubtype = d.subtype || 'BOTTLE';
                patch.amount = d.amount || 150;
                patch.duration = d.duration || 15;
            } else if (r.type === 'DIAPER') {
                patch.diaperType = d.type || 'PEE';
            } else if (r.type === 'SLEEP') {
                patch.sleepDuration = d.duration || 60;
            } else if (r.type === 'BATH') {
                patch.bathDuration = d.duration || 10;
            }

            this.setData(patch);
        } catch (err) {
            this.setData({ error: '加载记录失败', loading: false });
        }
    },

    setFeedSubtype(e) {
        const subtype = e.currentTarget.dataset.subtype;
        this.setData({ feedSubtype: subtype, amount: subtype === 'SOLID' ? 80 : 150 });
    },

    setAmount(e) {
        this.setData({ amount: parseInt(e.currentTarget.dataset.amount, 10) });
    },

    adjustAmount(e) {
        const delta = parseInt(e.currentTarget.dataset.delta, 10);
        this.setData({ amount: Math.max(10, this.data.amount + delta) });
    },

    setDuration(e) {
        this.setData({ duration: parseInt(e.currentTarget.dataset.duration, 10) });
    },

    adjustDuration(e) {
        const delta = parseInt(e.currentTarget.dataset.delta, 10);
        this.setData({ duration: Math.max(1, this.data.duration + delta) });
    },

    setDiaperType(e) {
        this.setData({ diaperType: e.currentTarget.dataset.type });
    },

    setSleepDuration(e) {
        this.setData({ sleepDuration: parseInt(e.currentTarget.dataset.duration, 10) });
    },

    setBathDuration(e) {
        this.setData({ bathDuration: parseInt(e.currentTarget.dataset.duration, 10) });
    },

    onRemarkInput(e) {
        this.setData({ remark: e.detail.value });
    },

    formatSleepPreset(mins) {
        if (mins < 60) return `${mins}分`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h${m}m` : `${h}h`;
    },

    async submit() {
        if (this.data.saving) return;
        this.setData({ saving: true });

        const { type, feedSubtype, amount, duration, diaperType, sleepDuration, bathDuration, remark, timeStr } = this.data;

        let details = {};
        if (type === 'FEED') {
            if (feedSubtype === 'BOTTLE') details = { subtype: 'BOTTLE', amount, unit: 'ml' };
            else if (feedSubtype === 'BREAST') details = { subtype: 'BREAST', duration };
            else details = { subtype: 'SOLID', amount, unit: 'g' };
        } else if (type === 'DIAPER') {
            details = { type: diaperType };
        } else if (type === 'SLEEP') {
            details = { duration: sleepDuration, unit: 'min' };
        } else if (type === 'BATH') {
            details = { duration: bathDuration, unit: 'min' };
        } else if (type === 'VITA_AD' || type === 'VITA_D3') {
            details = { amount: 1, unit: '粒' };
        }

        // Parse timeStr back to ISO
        const time = timeStr ? new Date(timeStr.replace(' ', 'T')).toISOString() : new Date().toISOString();

        try {
            await authedRequest(`/records/${this.recordId}`, {
                method: 'PATCH',
                data: { type, time, details, remark },
            });
            wx.showToast({ title: '保存成功', icon: 'success' });
            setTimeout(() => {
                wx.navigateBack();
            }, 600);
        } catch (err) {
            console.error(err);
            wx.showToast({ title: '保存失败', icon: 'none' });
        } finally {
            this.setData({ saving: false });
        }
    },
});
