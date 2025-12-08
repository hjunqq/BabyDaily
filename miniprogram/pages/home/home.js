const app = getApp();
const { fetchRecords, fetchSummary } = require('./home.api');

Page({
    data: {
        theme: 'A', // 'A' or 'B'
        greeting: '早上好，宝宝！',
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
        this.loadData();
    },

    loadData() {
        const babyId = app.globalData.babyId || 'demo-baby';
        this.setData({ loading: true, error: '' });

        fetchSummary(babyId, (err, data) => {
            if (err) {
                this.setData({ error: '加载统计失败', loading: false });
                return;
            }
            this.setData({
                summary: {
                    milkMl: data.milkMl || 0,
                    diaperWet: data.diaperWet || 0,
                    diaperSoiled: data.diaperSoiled || 0,
                    sleepMinutes: data.sleepMinutes || 0,
                    lastFeedTime: data.lastFeedTime || '',
                }
            });
            fetchRecords(babyId, (err2, records) => {
                if (err2) {
                    this.setData({ error: '加载记录失败', loading: false });
                    return;
                }
                const mapped = (records || []).slice(0, 5).map(r => ({
                    id: r.id,
                    type: this.mapType(r.type),
                    time: r.time ? r.time.slice(11, 16) : '',
                    value: this.mapValue(r),
                    label: ''
                }));
                this.setData({ recentRecords: mapped, loading: false });
            });
        });
    },

    mapType(t) {
        if (t === 'FEED') return '喂奶';
        if (t === 'SLEEP') return '睡眠';
        if (t === 'DIAPER') return '尿布';
        return '记录';
    },

    mapValue(r) {
        if (r.type === 'FEED') {
            const amt = r.details?.amount ? `${r.details.amount}ml` : '';
            return amt || '喂奶';
        }
        if (r.type === 'SLEEP') return r.details?.duration || '睡眠';
        if (r.type === 'DIAPER') return r.details?.type || '尿布';
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
