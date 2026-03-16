const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        selectedType: 'FEED',
        feedSubtype: 'BOTTLE',
        amount: 150,
        duration: 15,
        bathDuration: 10,
        submitting: false,
        feedPresets: [60, 80, 100, 120, 140, 160, 180, 200],
        breastPresets: [5, 10, 15, 20, 30],
        bathPresets: [5, 10, 15, 20, 30],
        types: [
            { key: 'FEED', label: '喂奶', icon: '🍼' },
            { key: 'DIAPER', label: '换尿布', icon: '🧷' },
            { key: 'BATH', label: '洗澡', icon: '🛁' },
        ],
    },

    onLoad(options) {
        if (options.type) {
            this.setData({ selectedType: options.type });
        }
    },

    selectType(e) {
        this.setData({ selectedType: e.currentTarget.dataset.type });
    },

    setFeedSubtype(e) {
        this.setData({ feedSubtype: e.currentTarget.dataset.subtype });
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

    async quickSaveDiaper(e) {
        const diaperType = e.currentTarget.dataset.type;
        if (this.data.submitting) return;
        this.setData({ submitting: true });

        try {
            await (app.readyPromise || Promise.resolve());
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
            const babyId = app.globalData.babyId;
            const { selectedType, feedSubtype, amount, duration, bathDuration } = this.data;

            let details = {};
            if (selectedType === 'FEED') {
                details = feedSubtype === 'BOTTLE'
                    ? { subtype: 'BOTTLE', amount, unit: 'ml' }
                    : { subtype: 'BREAST', duration };
            } else if (selectedType === 'BATH') {
                details = { duration: bathDuration, unit: 'min' };
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
