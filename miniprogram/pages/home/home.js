const app = getApp();
const { fetchRecords, fetchSummary } = require('./home.api');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

Page({
    data: {
        summary: {
            milkMl: 0,
            feedCount: 0,
            diaperWet: 0,
            diaperSoiled: 0,
            todayAdTaken: false,
            todayD3Taken: false,
        },
        recentRecords: [],
        todayFeeds: [],
        loading: true,
        error: '',
        babyName: '',
        babyAge: '',
        dateStr: '',
        lastFeed: { time: '', amount: '', subtype: '', elapsed: '', timeStr: '' },
        feedCardBg: 'linear-gradient(135deg, #fff5f5, #ffffff)',
        lastPeeText: '暂无记录',
        lastPooText: '暂无记录',
        lastBathText: '暂无记录',
        peeProgress: 0,
        pooProgress: 0,
        bathProgress: 0,
    },

    onLoad: function() {
        this.updateDateStr();
        const self = this;
        const ready = app.readyPromise || Promise.resolve();
        ready.then(function() {
            if (!app.ensureBabyContext()) return;
            const baby = app.globalData.babyProfile;
            if (baby) {
                self.setData({
                    babyName: baby.name || '',
                    babyAge: self.calcDays(baby.birthday),
                });
            }
            self.loadData();
        }).catch(function(err) {
            console.error('App init failed', err);
            const detail = err.message || err.errMsg || JSON.stringify(err);
            wx.showModal({ title: '登录失败', content: detail, showCancel: false });
            self.setData({ error: '登录失败，请稍后重试', loading: false });
        });
    },

    onShow: function() {
        if (!this.data.loading && !app.globalData.onboardingRequired && app.globalData.babyId) {
            this.loadData();
        }
    },

    onPullDownRefresh: function() {
        const self = this;
        this.loadData().then(function() { wx.stopPullDownRefresh(); });
    },

    calcDays: function(birthday) {
        if (!birthday) return '';
        const days = Math.floor((Date.now() - new Date(birthday).getTime()) / DAY);
        return days + ' 天';
    },

    updateDateStr: function() {
        const d = new Date();
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        this.setData({
            dateStr: d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' + weekdays[d.getDay()],
        });
    },

    formatElapsed: function(dateStr) {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        if (diff < 0) return '刚刚';
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '刚刚';
        if (mins < 60) return mins + '分钟前';
        const hours = Math.floor(mins / 60);
        const m = mins % 60;
        if (hours < 24) return m > 0 ? hours + '小时' + m + '分钟前' : hours + '小时前';
        return Math.floor(hours / 24) + '天前';
    },

    getProgress: function(time, maxMs) {
        if (!time) return 0;
        const elapsed = Math.max(0, Date.now() - new Date(time).getTime());
        return Math.min((elapsed / maxMs) * 100, 100);
    },

    getFeedCardBg: function(elapsedMs) {
        const hours = elapsedMs / (1000 * 60 * 60);
        const maxHours = 4;
        const pct = Math.min((hours / maxHours) * 100, 100);
        const ratio = Math.min(hours / maxHours, 1);
        const lightness = 95 - (ratio * 40);
        const saturation = 50 + (ratio * 40);
        return 'linear-gradient(90deg, #fff5f5 0%, hsl(350, ' + saturation + '%, ' + lightness + '%) ' + pct + '%, #ffffff ' + pct + '%)';
    },

    computeTimers: function(records, summaryResp) {
        const sr = summaryResp || {};
        const lastPeeTime = sr.lastPeeTime || sr.lastDiaperTime || '';
        const lastPooTime = sr.lastPooTime || sr.lastDiaperTime || '';
        const lastBathTime = sr.lastBathTime || '';

        this.setData({
            lastPeeText: lastPeeTime ? this.formatElapsed(lastPeeTime) : '暂无记录',
            lastPooText: lastPooTime ? this.formatElapsed(lastPooTime) : '暂无记录',
            lastBathText: lastBathTime ? this.formatElapsed(lastBathTime) : '暂无记录',
            peeProgress: this.getProgress(lastPeeTime, 24 * HOUR),
            pooProgress: this.getProgress(lastPooTime, 7 * DAY),
            bathProgress: this.getProgress(lastBathTime, 5 * DAY),
        });
    },

    computeLastFeed: function(records) {
        var feed = null;
        const list = records || [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].type === 'FEED') { feed = list[i]; break; }
        }
        if (!feed) {
            this.setData({
                lastFeed: { time: '', amount: '', subtype: '', elapsed: '', timeStr: '' },
                feedCardBg: 'linear-gradient(135deg, #fff5f5, #ffffff)',
            });
            return;
        }

        const details = feed.details || {};
        const isBreast = details.subtype === 'BREAST';
        const amount = isBreast ? (details.duration || 0) + ' 分钟' : (details.amount || 0) + ' ml';
        const subtype = isBreast ? '亲喂' : '瓶喂';
        const elapsedMs = Date.now() - new Date(feed.time).getTime();
        const timeStr = feed.time ? feed.time.slice(11, 16) : '';

        this.setData({
            lastFeed: { time: feed.time, amount: amount, subtype: subtype, elapsed: this.formatElapsed(feed.time), timeStr: timeStr },
            feedCardBg: this.getFeedCardBg(elapsedMs),
        });
    },

    computeTodayFeeds: function(records) {
        const today = new Date().toISOString().slice(0, 10);
        const list = records || [];
        const feeds = [];
        for (var i = 0; i < list.length; i++) {
            const r = list[i];
            if (r.type === 'FEED' && r.time && r.time.slice(0, 10) === today) {
                const d = r.details || {};
                feeds.push({
                    id: r.id,
                    time: r.time.slice(11, 16),
                    value: d.subtype === 'BREAST' ? (d.duration || 0) + '分钟' : (d.amount || 0) + 'ml',
                });
            }
        }
        this.setData({ todayFeeds: feeds });
    },

    loadData: function() {
        if (!app.ensureBabyContext()) {
            return Promise.resolve();
        }
        const babyId = app.globalData.babyId;
        const self = this;
        self.setData({ loading: true, error: '' });
        return Promise.all([
            fetchSummary(babyId),
            fetchRecords(babyId),
        ]).then(function(results) {
            const summaryResp = results[0] || {};
            const records = results[1] || [];
            self.setData({
                summary: {
                    milkMl: summaryResp.milkMl || 0,
                    feedCount: summaryResp.feedCount || 0,
                    diaperWet: summaryResp.diaperWet || 0,
                    diaperSoiled: summaryResp.diaperSoiled || 0,
                    todayAdTaken: !!summaryResp.todayAdTaken,
                    todayD3Taken: !!summaryResp.todayD3Taken,
                },
            });

            self.computeLastFeed(records);
            self.computeTimers(records, summaryResp);
            self.computeTodayFeeds(records);

            const mapped = [];
            const slice = records.slice(0, 6);
            for (var i = 0; i < slice.length; i++) {
                const r = slice[i];
                const d = r.details || {};
                mapped.push({
                    id: r.id,
                    icon: self.getIcon(r.type, d.subtype),
                    iconClass: self.getIconClass(r.type),
                    type: self.mapType(r.type, d.subtype),
                    time: r.time ? r.time.slice(11, 16) : '',
                    value: self.mapValue(r),
                });
            }
            self.setData({ recentRecords: mapped, loading: false });
        }).catch(function(err) {
            console.error('[Home] Load data failed:', err.message || err);
            const detail = err.message || err.errMsg || JSON.stringify(err);
            wx.showModal({ title: '数据加载失败', content: detail, showCancel: false });
            self.setData({ error: '加载数据失败，请下拉刷新重试', loading: false });
        });
    },

    getIcon: function(type, subtype) {
        if (type === 'FEED') return subtype === 'BREAST' ? '🤱' : (subtype === 'SOLID' ? '🥣' : '🍼');
        if (type === 'DIAPER') return '🧷';
        if (type === 'BATH') return '🛁';
        if (type === 'SLEEP') return '💤';
        if (type === 'VITA_AD') return '💊';
        if (type === 'VITA_D3') return '☀️';
        return '📝';
    },

    getIconClass: function(type) {
        if (type === 'FEED') return 'feed';
        if (type === 'DIAPER') return 'diaper';
        if (type === 'BATH') return 'bath';
        if (type === 'SLEEP') return 'sleep';
        if (type === 'VITA_AD' || type === 'VITA_D3') return 'supplement';
        return 'feed';
    },

    mapType: function(type, subtype) {
        if (type === 'FEED') {
            if (subtype === 'BREAST') return '亲喂';
            if (subtype === 'SOLID') return '辅食';
            return '瓶喂';
        }
        if (type === 'DIAPER') return '换尿布';
        if (type === 'BATH') return '洗澡';
        if (type === 'SLEEP') return '睡眠';
        if (type === 'VITA_AD') return '维生素 AD';
        if (type === 'VITA_D3') return '维生素 D3';
        return '记录';
    },

    mapValue: function(r) {
        const d = r.details || {};
        if (r.type === 'FEED') {
            if (d.subtype === 'BREAST') return (d.duration || 0) + ' 分钟';
            return d.amount ? d.amount + ' ml' : '';
        }
        if (r.type === 'DIAPER') {
            if (d.type === 'BOTH') return '尿 + 便';
            if (d.type === 'POO') return '便便';
            return '尿尿';
        }
        if (r.type === 'SLEEP') {
            const mins = d.duration || 0;
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return h > 0 ? h + 'h ' + m + 'm' : mins + 'm';
        }
        if (r.type === 'BATH') return d.duration ? d.duration + '分钟' : '';
        if (r.type === 'VITA_AD' || r.type === 'VITA_D3') return '已服用';
        return '';
    },

    quickFeed: function() {
        wx.navigateTo({ url: '/pages/record/record?type=FEED' });
    },

    goToDiaper: function() {
        wx.navigateTo({ url: '/pages/record/record?type=DIAPER' });
    },

    goToBath: function() {
        wx.navigateTo({ url: '/pages/record/record?type=BATH' });
    },

    quickSleep: function() {
        wx.navigateTo({ url: '/pages/record/record?type=SLEEP' });
    },

    goToRecord: function() {
        wx.navigateTo({ url: '/pages/record/record' });
    },

    goToRecordDetail: function(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/record-detail/record-detail?id=' + id });
    },

    quickSupplement: function(e) {
        const supplementType = e.currentTarget.dataset.type;
        const self = this;
        if (supplementType === 'VITA_AD' && this.data.summary.todayAdTaken) {
            wx.showToast({ title: '今天已服用 AD', icon: 'none' });
            return;
        }
        if (supplementType === 'VITA_D3' && this.data.summary.todayD3Taken) {
            wx.showToast({ title: '今天已服用 D3', icon: 'none' });
            return;
        }
        const { authedRequest } = require('../../utils/api');
        authedRequest('/records', {
            method: 'POST',
            data: {
                babyId: app.globalData.babyId,
                type: supplementType,
                time: new Date().toISOString(),
                details: { amount: 1, unit: '粒' },
            },
        }).then(function() {
            wx.showToast({ title: '已记录', icon: 'success' });
            self.loadData();
        }).catch(function() {
            wx.showToast({ title: '记录失败', icon: 'none' });
        });
    },
});
