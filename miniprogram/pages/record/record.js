const app = getApp();
const { authedRequest } = require('../../utils/api');

Page({
    data: {
        theme: 'A',
        selectedType: 'FEED',
        inputValue: '',
        sleepEnd: '',
        diaperType: 'PEE',
        types: [
            { key: 'FEED', label: '喂奶', unit: 'ml' },
            { key: 'DIAPER', label: '换尿布', unit: '' },
            { key: 'SLEEP', label: '睡眠', unit: '分钟' }
        ]
    },

    onLoad() {
        this.setData({ theme: app.globalData.theme || 'A' });
    },

    selectType(e) {
        this.setData({ selectedType: e.currentTarget.dataset.type, inputValue: '', sleepEnd: '' });
    },

    onInput(e) {
        this.setData({ inputValue: e.detail.value });
    },

    onSleepEnd(e) {
        this.setData({ sleepEnd: e.detail.value });
    },

    onDiaperChange(e) {
        this.setData({ diaperType: e.currentTarget.dataset.type });
    },

    async submit() {
        try {
            await (app.readyPromise || Promise.resolve());
        } catch (err) {
            console.error('Init failed before submit', err);
            wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
            return;
        }
        const babyId = app.globalData.babyId;
        const { selectedType, inputValue, sleepEnd, diaperType } = this.data;

        let details = {};
        if (selectedType === 'FEED') {
            if (!inputValue) {
                wx.showToast({ title: '请输入奶量', icon: 'none' });
                return;
            }
            details = { amount: parseInt(inputValue, 10), unit: 'ml', subtype: 'FORMULA' };
        }
        if (selectedType === 'DIAPER') {
            details = { type: diaperType };
        }
        if (selectedType === 'SLEEP') {
            details = { duration: inputValue ? `${inputValue} min` : '' };
        }

        try {
            await authedRequest('/records', {
                method: 'POST',
                data: {
                    baby_id: babyId,
                    type: selectedType,
                    time: new Date().toISOString(),
                    end_time: sleepEnd ? new Date(sleepEnd).toISOString() : undefined,
                    details,
                },
            });
            wx.showToast({ title: '记录成功', icon: 'success' });
            wx.navigateBack();
        } catch (err) {
            console.error('Submit record failed', err);
            wx.showToast({ title: '提交失败，请稍后再试', icon: 'none' });
        }
    }
});
