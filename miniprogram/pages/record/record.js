const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        selectedType: 'FEED',
        feedSubtype: 'BOTTLE',
        amount: 150,
        duration: 15,
        bathDuration: 10,
        sleepDuration: 90,
        submitting: false,
        feedPresets: [100, 120, 140, 150, 160, 180, 200, 220],
        breastPresets: [5, 10, 15, 20, 25, 30],
        solidPresets: [30, 50, 80, 100, 120, 150],
        bathPresets: [5, 10, 15, 20, 30],
        sleepPresets: [30, 45, 60, 90, 120, 150, 180, 240],
        types: [
            { key: 'FEED', label: '喂奶', icon: '🍼' },
            { key: 'DIAPER', label: '换尿布', icon: '🧷' },
            { key: 'SLEEP', label: '睡眠', icon: '💤' },
            { key: 'BATH', label: '洗澡', icon: '🛁' },
        ],
    },

    onLoad(options) {
        if (!app.ensureBabyContext()) return;
        if (options.type) {
            this.setData({ selectedType: options.type });
        }
    },

    selectType(e) {
        this.setData({ selectedType: e.currentTarget.dataset.type });
    },

    setFeedSubtype(e) {
        const subtype = e.currentTarget.dataset.subtype;
        this.setData({
            feedSubtype: subtype,
            amount: subtype === 'SOLID' ? 80 : 150,
        });
    },

    setAmount(e) {
        this.setData({ amount: parseInt(e.currentTarget.dataset.amount, 10) });
    },

    adjustAmount(e) {
        const delta = parseInt(e.currentTarget.dataset.delta, 10);
        const newAmount = Math.max(10, this.data.amount + delta);
        this.setData({ amount: newAmount });
    },

    setDuration(e) {
        this.setData({ duration: parseInt(e.currentTarget.dataset.duration, 10) });
    },

    setBathDuration(e) {
        this.setData({ bathDuration: parseInt(e.currentTarget.dataset.duration, 10) });
    },

    setSleepDuration(e) {
        this.setData({ sleepDuration: parseInt(e.currentTarget.dataset.duration, 10) });
    },

    formatSleepPreset(mins) {
        if (mins < 60) return `${mins}分钟`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}小时${m}分` : `${h}小时`;
    },

    async quickSaveDiaper(e) {
        const diaperType = e.currentTarget.dataset.type;
        if (this.data.submitting) return;
        this.setData({ submitting: true });
        try {
            await (app.readyPromise || Promise.resolve());
            if (!app.ensureBabyContext()) return;
            await authedRequest('/records', {
                method: 'POST',
                data: {
                    babyId: app.globalData.babyId,
                    type: 'DIAPER',
                    time: new Date().toISOString(),
                    details: { type: diaperType },
                },
            });
            wx.showToast({ title: '已记录', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 500);
        } catch (err) {
            console.error('Save diaper failed', err);
            wx.showToast({ title: '保存失败', icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    },

    async submit() {
        if (this.data.submitting) return;
        this.setData({ submitting: true });
        try {
            await (app.readyPromise || Promise.resolve());
            if (!app.ensureBabyContext()) return;
            const babyId = app.globalData.babyId;
            const { selectedType, feedSubtype, amount, duration, bathDuration, sleepDuration } = this.data;

            let details = {};
            if (selectedType === 'FEED') {
                if (feedSubtype === 'BOTTLE') {
                    details = { subtype: 'BOTTLE', amount, unit: 'ml' };
                } else if (feedSubtype === 'BREAST') {
                    details = { subtype: 'BREAST', duration };
                } else {
                    details = { subtype: 'SOLID', amount, unit: 'ml' };
                }
            } else if (selectedType === 'BATH') {
                details = { duration: bathDuration, unit: 'min' };
            } else if (selectedType === 'SLEEP') {
                details = { duration: sleepDuration, unit: 'min' };
            }

            await authedRequest('/records', {
                method: 'POST',
                data: {
                    babyId,
                    type: selectedType,
                    time: new Date().toISOString(),
                    details,
                },
            });

            wx.showToast({ title: '记录成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 500);
        } catch (err) {
            console.error('Submit record failed', err);
            wx.showToast({ title: '提交失败', icon: 'none' });
        } finally {
            this.setData({ submitting: false });
        }
    },
});
