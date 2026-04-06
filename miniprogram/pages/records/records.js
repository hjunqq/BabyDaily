const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        groups: [],
        loading: true,
        error: '',
        query: '',
        page: 1,
        hasMore: false,
        loadingMore: false,
        allRecords: [],
    },

    onLoad: function() {
        const self = this;
        const ready = app.readyPromise || Promise.resolve();
        ready.then(function() {
            if (!app.ensureBabyContext()) return;
            self.loadData();
        }).catch(function() {
            self.setData({ error: '登录失败，请重试', loading: false });
        });
    },

    onShow: function() {
        if (!this.data.loading && !app.globalData.onboardingRequired) this.loadData();
    },

    onPullDownRefresh: function() {
        const self = this;
        this.loadData().then(function() { wx.stopPullDownRefresh(); });
    },

    loadData: function() {
        if (!app.ensureBabyContext()) {
            return Promise.resolve();
        }
        const babyId = app.globalData.babyId;
        const self = this;
        self.setData({ loading: true, error: '', page: 1 });
        return authedRequest('/records/baby/' + babyId + '?limit=50').then(function(records) {
            const list = records || [];
            self.setData({ allRecords: list, hasMore: list.length >= 50, loading: false });
            self.applyFilter();
        }).catch(function() {
            self.setData({ error: '加载失败，请下拉刷新', loading: false });
        });
    },

    loadMore: function() {
        if (this.data.loadingMore || !this.data.hasMore) return;
        if (!app.ensureBabyContext()) return;
        const babyId = app.globalData.babyId;
        const nextPage = this.data.page + 1;
        const self = this;
        self.setData({ loadingMore: true });
        authedRequest('/records/baby/' + babyId + '?limit=50&page=' + nextPage).then(function(more) {
            if (!more || more.length === 0) {
                self.setData({ hasMore: false, loadingMore: false });
            } else {
                const all = self.data.allRecords.concat(more);
                self.setData({ allRecords: all, page: nextPage, hasMore: more.length >= 50, loadingMore: false });
                self.applyFilter();
            }
        }).catch(function() {
            wx.showToast({ title: '加载失败', icon: 'none' });
            self.setData({ loadingMore: false });
        });
    },

    onSearchInput: function(e) {
        this.setData({ query: e.detail.value });
        this.applyFilter();
    },

    onSearchClear: function() {
        this.setData({ query: '' });
        this.applyFilter();
    },

    applyFilter: function() {
        const allRecords = this.data.allRecords;
        const q = (this.data.query || '').toLowerCase();
        const self = this;
        var list = allRecords;
        if (q) {
            list = [];
            for (var i = 0; i < allRecords.length; i++) {
                const r = allRecords[i];
                const d = r.details || {};
                const label = self.mapType(r.type, d.subtype);
                const val = self.mapValue(r);
                if ((label + val).toLowerCase().indexOf(q) !== -1) {
                    list.push(r);
                }
            }
        }

        const groupMap = {};
        const groupOrder = [];
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        for (var j = 0; j < list.length; j++) {
            const r = list[j];
            const date = new Date(r.time);
            const d = r.details || {};
            var key;
            if (date.toDateString() === today.toDateString()) key = '今天';
            else if (date.toDateString() === yesterday.toDateString()) key = '昨天';
            else key = (date.getMonth() + 1) + '月' + date.getDate() + '日';

            if (!groupMap[key]) {
                groupMap[key] = [];
                groupOrder.push(key);
            }
            groupMap[key].push({
                id: r.id,
                icon: self.getIcon(r.type, d.subtype),
                iconClass: self.getIconClass(r.type),
                typeLabel: self.mapType(r.type, d.subtype),
                timeStr: r.time ? r.time.slice(11, 16) : '',
                value: self.mapValue(r),
            });
        }

        const groups = [];
        for (var k = 0; k < groupOrder.length; k++) {
            groups.push({ key: groupOrder[k], items: groupMap[groupOrder[k]] });
        }
        this.setData({ groups: groups });
    },

    goToDetail: function(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/record-detail/record-detail?id=' + id });
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
            if (d.subtype === 'BREAST') return (d.duration || 0) + '分钟';
            return d.amount ? d.amount + 'ml' : '';
        }
        if (r.type === 'DIAPER') {
            if (d.type === 'BOTH') return '尿+便';
            if (d.type === 'POO') return '便便';
            return '尿尿';
        }
        if (r.type === 'SLEEP') {
            const mins = d.duration || 0;
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return h > 0 ? h + 'h' + m + 'm' : mins + 'm';
        }
        if (r.type === 'BATH') return d.duration ? d.duration + '分钟' : '';
        if (r.type === 'VITA_AD' || r.type === 'VITA_D3') return '已服用';
        return '';
    },
});
