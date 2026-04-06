const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        loading: true,
        error: '',
        days: 14,
        trendData: [],
        summary: {
            avgMilk: 0,
            maxMilk: 0,
            minMilk: 0,
            activeDays: 0,
        },
        canvasW: 300,
        canvasH: 200,
        milkEmpty: false,
        solidEmpty: false,
    },

    onLoad: function() {
        const sys = wx.getSystemInfoSync();
        const ratio = sys.windowWidth / 750;
        const canvasW = Math.floor(sys.windowWidth - 48 * ratio);
        this.setData({ canvasW: canvasW, canvasH: 200 });

        const self = this;
        const ready = app.readyPromise || Promise.resolve();
        ready.then(function() {
            if (!app.ensureBabyContext()) return;
            self.loadData();
        }).catch(function() {
            self.setData({ error: '加载失败', loading: false });
        });
    },

    onPullDownRefresh: function() {
        const self = this;
        this.loadData().then(function() { wx.stopPullDownRefresh(); });
    },

    setDays: function(e) {
        this.setData({ days: parseInt(e.currentTarget.dataset.days, 10) });
        this.loadData();
    },

    loadData: function() {
        if (!app.ensureBabyContext()) {
            return Promise.resolve();
        }
        const babyId = app.globalData.babyId;
        const self = this;
        self.setData({ loading: true, error: '' });
        return authedRequest('/records/baby/' + babyId + '/trend?days=' + self.data.days).then(function(data) {
            const list = Array.isArray(data) ? data : [];

            // Compute milk values for summary
            var milkSum = 0, milkMax = 0, milkMin = -1, activeDays = 0;
            for (var i = 0; i < list.length; i++) {
                const v = list[i].milkMl || 0;
                if (v > 0) {
                    milkSum += v;
                    activeDays++;
                    if (v > milkMax) milkMax = v;
                    if (milkMin < 0 || v < milkMin) milkMin = v;
                }
            }

            const summary = {
                avgMilk: activeDays > 0 ? Math.round(milkSum / activeDays) : 0,
                maxMilk: milkMax,
                minMilk: milkMin < 0 ? 0 : milkMin,
                activeDays: activeDays,
            };

            const trendData = [];
            for (var j = 0; j < list.length; j++) {
                const item = list[j];
                trendData.push({
                    date: item.date ? item.date.slice(5) : '',
                    milk: item.milkMl || 0,
                    solid: item.solidG || 0,
                });
            }

            var milkEmpty = true, solidEmpty = true;
            for (var k = 0; k < trendData.length; k++) {
                if (trendData[k].milk > 0) milkEmpty = false;
                if (trendData[k].solid > 0) solidEmpty = false;
            }

            self.setData({ trendData: trendData, summary: summary, milkEmpty: milkEmpty, solidEmpty: solidEmpty, loading: false });

            wx.nextTick(function() {
                if (!milkEmpty) self.drawBarChart('milkCanvas', trendData, 'milk', '#F3B6C2');
                if (!solidEmpty) self.drawBarChart('solidCanvas', trendData, 'solid', '#B5EAD7');
            });
        }).catch(function(err) {
            console.error('[Statistics] loadData error:', err);
            self.setData({ error: '加载趋势失败，请下拉刷新', loading: false });
        });
    },

    drawBarChart: function(canvasId, data, field, barColor) {
        const W = this.data.canvasW;
        const H = this.data.canvasH;
        const padL = 46, padR = 8, padT = 16, padB = 36;
        const chartW = W - padL - padR;
        const chartH = H - padT - padB;

        var maxVal = 1;
        for (var i = 0; i < data.length; i++) {
            const v = data[i][field] || 0;
            if (v > maxVal) maxVal = v;
        }

        const ctx = wx.createCanvasContext(canvasId, this);

        ctx.setFillStyle('#ffffff');
        ctx.fillRect(0, 0, W, H);

        // Grid + Y labels
        const ySteps = 4;
        ctx.setFontSize(10);
        ctx.setTextAlign('right');
        for (var s = 0; s <= ySteps; s++) {
            const ratio = s / ySteps;
            const y = padT + chartH * (1 - ratio);
            const val = Math.round(maxVal * ratio);
            ctx.setStrokeStyle(s === 0 ? '#ddd' : '#f0f0f0');
            ctx.setLineWidth(s === 0 ? 1.5 : 1);
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(W - padR, y);
            ctx.stroke();
            ctx.setFillStyle('#bbb');
            ctx.fillText(String(val), padL - 4, y + 4);
        }

        // Bars
        const n = data.length;
        const barAreaW = chartW / n;
        const barW = Math.max(Math.min(barAreaW * 0.6, 18), 4);
        const labelEvery = Math.max(1, Math.ceil(n / 7));

        for (var i = 0; i < data.length; i++) {
            const val = data[i][field] || 0;
            const barH = val > 0 ? Math.max((val / maxVal) * chartH, 2) : 0;
            const x = padL + barAreaW * i + (barAreaW - barW) / 2;
            const y = padT + chartH - barH;

            if (barH > 0) {
                ctx.setFillStyle(barColor);
                const r = Math.min(3, barW / 2, barH / 2);
                ctx.beginPath();
                ctx.moveTo(x + r, y);
                ctx.lineTo(x + barW - r, y);
                ctx.arcTo(x + barW, y, x + barW, y + r, r);
                ctx.lineTo(x + barW, y + barH);
                ctx.lineTo(x, y + barH);
                ctx.lineTo(x, y + r);
                ctx.arcTo(x, y, x + r, y, r);
                ctx.closePath();
                ctx.fill();
            }

            if (barH > 22 && val > 0) {
                ctx.setFontSize(9);
                ctx.setTextAlign('center');
                ctx.setFillStyle('#fff');
                ctx.fillText(String(val), x + barW / 2, y + 12);
            }

            if (i % labelEvery === 0) {
                ctx.setFontSize(9);
                ctx.setTextAlign('center');
                ctx.setFillStyle('#bbb');
                ctx.fillText(data[i].date, x + barW / 2, H - padB + 14);
            }
        }

        ctx.draw();
    },
});
