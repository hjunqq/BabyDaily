const app = getApp();
const { authedRequest } = require('../../utils/api');
const { formatLocalTime, formatMonthDay, isSameLocalDay } = require('../../utils/datetime');
const {
    recordIcon,
    recordIconClass,
    recordTypeLabel,
    recordValue,
} = require('../../utils/record-display');

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
        let list = allRecords;

        if (q) {
            list = [];
            for (let i = 0; i < allRecords.length; i++) {
                const r = allRecords[i];
                const d = r.details || {};
                const label = recordTypeLabel(r.type, d.subtype);
                const val = recordValue(r);
                if ((label + val).toLowerCase().indexOf(q) !== -1) {
                    list.push(r);
                }
            }
        }

        const groupMap = {};
        const groupOrder = [];
        const today = new Date();
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        for (let j = 0; j < list.length; j++) {
            const r = list[j];
            const date = new Date(r.time);
            const d = r.details || {};
            let key;

            if (isSameLocalDay(date, today)) key = '今天';
            else if (isSameLocalDay(date, yesterday)) key = '昨天';
            else key = formatMonthDay(date);

            if (!groupMap[key]) {
                groupMap[key] = [];
                groupOrder.push(key);
            }

            groupMap[key].push({
                id: r.id,
                icon: recordIcon(r.type, d.subtype),
                iconClass: recordIconClass(r.type),
                typeLabel: recordTypeLabel(r.type, d.subtype),
                timeStr: r.formattedTime || formatLocalTime(r.time),
                value: recordValue(r),
            });
        }

        const groups = [];
        for (let k = 0; k < groupOrder.length; k++) {
            groups.push({ key: groupOrder[k], items: groupMap[groupOrder[k]] });
        }
        this.setData({ groups: groups });
    },

    goToDetail: function(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/record-detail/record-detail?id=' + id });
    },

});
