const { initSession } = require('./utils/api');

App({
    onLaunch() {
        this.readyPromise = initSession()
            .then(({ token, user, babyId, baby }) => {
                this.globalData.token = token;
                this.globalData.userInfo = user;
                this.globalData.babyId = babyId;
                this.globalData.babyProfile = baby;
            })
            .catch((err) => {
                console.error('[App] Login failed:', err.message || err);
                wx.showModal({
                    title: '登录失败',
                    content: err.message || '无法连接服务器，请检查网络后重试',
                    showCancel: false,
                });
                throw err;
            });
    },
    globalData: {
        userInfo: null,
        token: '',
        babyId: '',
        babyProfile: null,
        theme: 'A' // 'A' | 'B'
    }
});
