const app = getApp();
const { fetchRecords, fetchSummary } = require('./home.api');

Page({
    data: {
        theme: 'A', // 'A' or 'B'
        greeting: '早上好，宝妈！',
        summary: {
            milkMl: 0,
            diaperWet: 0,
            diaperSoiled: 0,
            sleepMinutes: 0,
            lastFeedTime: '',
        },
        recentRecords: [],
        loading: true,
        error: '',
    },

    onLoad() {
        this.setData({ theme: app.globalData.theme || 'A' });
        const ready = app.readyPromise || Promise.resolve();
        ready
            .then(() => this.loadData())
            .catch((err) => {
                console.error('App init failed', err);
                this.setData({ error: '登录失败，请稍后重试', loading: false });
            });
    },

    async loadData() {
        const babyId = app.globalData.babyId;
        this.setData({ loading: true, error: '' });

        try {
            const summaryResp = await fetchSummary(babyId);
            this.setData({
                summary: {
                    milkMl: summaryResp?.milk_ml || 0,
                    diaperWet: summaryResp?.diaper_wet || 0,
                    diaperSoiled: summaryResp?.diaper_soiled || 0,
                    sleepMinutes: summaryResp?.sleep_minutes || 0,
                    lastFeedTime: summaryResp?.last_feed_time || '',
                }
            });

            const records = await fetchRecords(babyId);
            const mapped = (records || []).slice(0, 5).map((r) => ({
                id: r.id,
                type: this.mapType(r.type),
                time: r.time ? r.time.slice(11, 16) : '',
                value: this.mapValue(r),
                label: '',
            }));
            this.setData({ recentRecords: mapped, loading: false });
        } catch (err) {
            console.error('Load home data failed', err);
            this.setData({ error: '加载数据失败，请稍后再试', loading: false });
        }
    },

    mapType(t) {
        if (t === 'FEED') return '喂养';
        if (t === 'SLEEP') return '睡眠';
        if (t === 'DIAPER') return '换尿布';
        return '记录';
    },

    mapValue(r) {
        if (r.type === 'FEED') {
            const amt = r.details?.amount ? `${r.details.amount}ml` : '';
            return amt || '喂养';
        }
        if (r.type === 'SLEEP') return r.details?.duration || '睡眠';
        if (r.type === 'DIAPER') return r.details?.type || '换尿布';
        return '';
    },

    toggleTheme() {
        const newTheme = this.data.theme === 'A' ? 'B' : 'A';
        this.setData({ theme: newTheme });
        app.globalData.theme = newTheme;
    },

    goToRecord() {
        wx.navigateTo({
            url: '/pages/record/record'
        });
    }
});
