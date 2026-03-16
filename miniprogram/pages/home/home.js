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
    },

    onLoad() {
        this.updateGreeting();
        const ready = app.readyPromise || Promise.resolve();
        ready
            .then(() => {
                const baby = app.globalData.babyProfile;
                if (baby) this.setData({ babyName: baby.name || '' });
                this.loadData();
            })
            .catch((err) => {
                console.error('App init failed', err);
                this.setData({ error: '登录失败，请稍后重试', loading: false });
            });
    },

    onPullDownRefresh() {
        this.loadData().then(() => wx.stopPullDownRefresh());
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

            const mapped = (records || []).slice(0, 5).map((r) => ({
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
        if (type === 'FEED') return subtype === 'BREAST' ? '🤱' : '🍼';
        if (type === 'DIAPER') return '🧷';
        if (type === 'BATH') return '🛁';
        if (type === 'SLEEP') return '💤';
        if (type === 'VITA_AD') return '💊';
        if (type === 'VITA_D3') return '☀️';
        return '📝';
    },

    mapType(type, subtype) {
        if (type === 'FEED') return subtype === 'BREAST' ? '亲喂' : '瓶喂';
        if (type === 'DIAPER') return '换尿布';
        if (type === 'BATH') return '洗澡';
        if (type === 'SLEEP') return '睡眠';
        if (type === 'VITA_AD') return '维生素AD';
        if (type === 'VITA_D3') return '维生素D3';
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
        if (r.type === 'BATH') return r.details?.duration ? `${r.details.duration}分钟` : '洗澡';
        if (r.type === 'VITA_AD' || r.type === 'VITA_D3') return '1粒';
        return '';
    },

    goToRecord() {
        wx.navigateTo({ url: '/pages/record/record' });
    },

    quickFeed() {
        wx.navigateTo({ url: '/pages/record/record?type=FEED' });
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
