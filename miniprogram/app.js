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
                console.error('Login failed', err);
                wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
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
