const app = getApp();
const API_URL = 'http://localhost:3000';

const request = (url, options = {}) => {
    return wx.request({
        url: API_URL + url,
        method: options.method || 'POST',
        data: options.data,
        header: {
            'Content-Type': 'application/json',
        },
        success: options.success,
        fail: options.fail,
    });
};

Page({
    data: {
        theme: 'A',
        selectedType: 'FEED',
        inputValue: '',
        sleepEnd: '',
        diaperType: 'PEE',
        types: [
            { key: 'FEED', label: '喂奶', unit: 'ml' },
            { key: 'DIAPER', label: '尿布', unit: '' },
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

    submit() {
        const babyId = app.globalData.babyId || 'demo-baby';
        const { selectedType, inputValue, sleepEnd, diaperType } = this.data;

        let details = {};
        if (selectedType === 'FEED') {
            if (!inputValue) {
                wx.showToast({ title: '请输入奶量', icon: 'none' });
                return;
            }
            details = { amount: parseInt(inputValue), unit: 'ml', subtype: 'FORMULA' };
        }
        if (selectedType === 'DIAPER') {
            details = { type: diaperType };
        }
        if (selectedType === 'SLEEP') {
            details = { duration: inputValue ? `${inputValue} min` : '' };
        }

        request('/records', {
            data: {
                baby_id: babyId,
                type: selectedType,
                time: new Date().toISOString(),
                end_time: sleepEnd ? new Date(sleepEnd).toISOString() : undefined,
                details,
            },
            success: () => {
                wx.showToast({ title: '记录成功', icon: 'success' });
                wx.navigateBack();
            },
            fail: () => {
                wx.showToast({ title: '提交失败', icon: 'none' });
            }
        });
    }
});
