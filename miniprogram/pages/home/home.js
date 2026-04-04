const app = getApp();
const { fetchRecords, fetchSummary } = require('./home.api');

Page({
    data: {
        greeting: '',
        summary: {
            milkMl: 0,
            feedCount: 0,
            diaperWet: 0,
            diaperSoiled: 0,
            todayAdTaken: false,
            todayD3Taken: false,
        },
        recentRecords: [],
        loading: true,
        error: '',
        babyName: '',
        babyAge: '',
        lastFeedText: '',
        lastPeeText: '',
        lastPooText: '',
        lastBathText: '',
    },

    onLoad() {
        this.updateGreeting();
        const ready = app.readyPromise || Promise.resolve();
        ready
            .then(() => {
                const baby = app.globalData.babyProfile;
                if (baby) {
                    this.setData({
                        babyName: baby.name || '',
                        babyAge: this.calcAge(baby.birthday),
                    });
                }
                this.loadData();
            })
            .catch((err) => {
                console.error('App init failed', err);
                this.setData({ error: '登录失败，请稍后重试', loading: false });
            });
    },

    onShow() {
        if (!this.data.loading && app.globalData.babyId) {
            this.loadData();
        }
    },

    onPullDownRefresh() {
        this.loadData().then(() => wx.stopPullDownRefresh());
    },

    calcAge(birthday) {
        if (!birthday) return '';
        const birth = new Date(birthday);
        const now = new Date();
        const days = Math.floor((now - birth) / 86400000);
        if (days < 30) return `出生第 ${days + 1} 天`;
        const months = Math.floor(days / 30);
        const remainDays = days % 30;
        if (months < 12) return `${months}个月${remainDays}天`;
        const years = Math.floor(months / 12);
        const remainMonths = months % 12;
        return `${years}岁${remainMonths}个月`;
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '晚上好';
        if (hour < 6) greeting = '夜深了';
        else if (hour < 12) greeting = '早上好';
        else if (hour < 14) greeting = '中午好';
        else if (hour < 18) greeting = '下午好';
        this.setData({ greeting });
    },

    formatElapsed(dateStr) {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        if (diff < 0) return '刚刚';
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return `${mins}分钟前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}小时${mins % 60}分钟前`;
        const days = Math.floor(hours / 24);
        return `${days}天前`;
    },

    computeTimers(records) {
        let lastFeed = null, lastPee = null, lastPoo = null, lastBath = null;
        for (const r of (records || [])) {
            if (r.type === 'FEED' && !lastFeed) lastFeed = r.time;
            if (r.type === 'DIAPER') {
                const dt = r.details?.type;
                if (!lastPee && (dt === 'PEE' || dt === 'BOTH')) lastPee = r.time;
                if (!lastPoo && (dt === 'POO' || dt === 'BOTH')) lastPoo = r.time;
            }
            if (r.type === 'BATH' && !lastBath) lastBath = r.time;
            if (lastFeed && lastPee && lastPoo && lastBath) break;
        }
        this.setData({
            lastFeedText: lastFeed ? this.formatElapsed(lastFeed) : '暂无',
            lastPeeText: lastPee ? this.formatElapsed(lastPee) : '暂无',
            lastPooText: lastPoo ? this.formatElapsed(lastPoo) : '暂无',
            lastBathText: lastBath ? this.formatElapsed(lastBath) : '暂无',
        });
    },

    async loadData() {
        const babyId = app.globalData.babyId;
        this.setData({ loading: true, error: '' });
        try {
            const [summaryResp, records] = await Promise.all([
                fetchSummary(babyId),
                fetchRecords(babyId),
            ]);
            this.setData({
                summary: {
                    milkMl: summaryResp?.milkMl || 0,
                    feedCount: summaryResp?.feedCount || 0,
                    diaperWet: summaryResp?.diaperWet || 0,
                    diaperSoiled: summaryResp?.diaperSoiled || 0,
                    todayAdTaken: !!summaryResp?.todayAdTaken,
                    todayD3Taken: !!summaryResp?.todayD3Taken,
                },
            });
            this.computeTimers(records);
            const mapped = (records || []).slice(0, 8).map((r) => ({
                id: r.id,
                icon: this.getIcon(r.type, r.details?.subtype),
                type: this.mapType(r.type, r.details?.subtype),
                time: r.time ? r.time.slice(11, 16) : '',
                value: this.mapValue(r),
            }));
            this.setData({ recentRecords: mapped, loading: false });
        } catch (err) {
            console.error('Load home data failed', err);
            this.setData({ error: '加载数据失败，请稍后再试', loading: false });
        }
    },

    getIcon(type, subtype) {
        if (type === 'FEED') return subtype === 'BREAST' ? '🤱' : (subtype === 'SOLID' ? '🥣' : '🍼');
        if (type === 'DIAPER') return '🧷';
        if (type === 'BATH') return '🛁';
        if (type === 'SLEEP') return '💤';
        if (type === 'VITA_AD') return '💊';
        if (type === 'VITA_D3') return '☀️';
        return '📝';
    },

    mapType(type, subtype) {
        if (type === 'FEED') {
            if (subtype === 'BREAST') return '亲喂';
            if (subtype === 'SOLID') return '辅食';
            return '瓶喂';
        }
        if (type === 'DIAPER') return '换尿布';
        if (type === 'BATH') return '洗澡';
        if (type === 'SLEEP') return '睡眠';
        if (type === 'VITA_AD') return 'AD';
        if (type === 'VITA_D3') return 'D3';
        return '记录';
    },

    mapValue(r) {
        if (r.type === 'FEED') {
            if (r.details?.subtype === 'BREAST') return `${r.details?.duration || 0}分钟`;
            return r.details?.amount ? `${r.details.amount}ml` : '';
        }
        if (r.type === 'DIAPER') {
            const t = r.details?.type;
            if (t === 'BOTH') return '尿+便';
            if (t === 'POO') return '便便';
            return '尿尿';
        }
        if (r.type === 'SLEEP') return r.details?.duration ? `${r.details.duration}分钟` : '';
        if (r.type === 'BATH') return r.details?.duration ? `${r.details.duration}分钟` : '';
        if (r.type === 'VITA_AD' || r.type === 'VITA_D3') return '已服用';
        return '';
    },

    goToRecord() {
        wx.navigateTo({ url: '/pages/record/record' });
    },

    quickFeed() {
        wx.navigateTo({ url: '/pages/record/record?type=FEED' });
    },

    quickSleep() {
        wx.navigateTo({ url: '/pages/record/record?type=SLEEP' });
    },

    async quickDiaper(e) {
        const diaperType = e.currentTarget.dataset.type || 'PEE';
        try {
            const { authedRequest } = require('../../utils/api');
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
            this.loadData();
        } catch (err) {
            wx.showToast({ title: '记录失败', icon: 'none' });
        }
    },

    async quickSupplement(e) {
        const supplementType = e.currentTarget.dataset.type;
        if (supplementType === 'VITA_AD' && this.data.summary.todayAdTaken) {
            wx.showToast({ title: '今天已服用 AD', icon: 'none' });
            return;
        }
        if (supplementType === 'VITA_D3' && this.data.summary.todayD3Taken) {
            wx.showToast({ title: '今天已服用 D3', icon: 'none' });
            return;
        }
        try {
            const { authedRequest } = require('../../utils/api');
            await authedRequest('/records', {
                method: 'POST',
                data: {
                    babyId: app.globalData.babyId,
                    type: supplementType,
                    time: new Date().toISOString(),
                    details: { amount: 1, unit: '粒' },
                },
            });
            wx.showToast({ title: '已记录', icon: 'success' });
            this.loadData();
        } catch (err) {
            wx.showToast({ title: '记录失败', icon: 'none' });
        }
    },
});
