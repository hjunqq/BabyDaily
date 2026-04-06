const { initSession } = require('./utils/api');

App({
    onLaunch() {
        this.readyPromise = initSession()
            .then((session) => {
                this.applySession(session);
                if (session.onboardingRequired) {
                    setTimeout(() => {
                        wx.reLaunch({ url: '/pages/onboarding/onboarding' });
                    }, 0);
                }
                return session;
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

    applySession(session) {
        this.globalData.token = session.token || '';
        this.globalData.userInfo = session.user || null;
        this.globalData.family = session.family || null;
        this.globalData.babyId = session.babyId || '';
        this.globalData.babyProfile = session.baby || null;
        this.globalData.onboardingRequired = !!session.onboardingRequired;
        this.globalData.membershipPending = !!session.membershipPending;
        this.globalData.role = session.role || null;
    },

    ensureBabyContext() {
        if (this.globalData.onboardingRequired || !this.globalData.babyId) {
            wx.reLaunch({ url: '/pages/onboarding/onboarding' });
            return false;
        }
        return true;
    },

    globalData: {
        userInfo: null,
        token: '',
        family: null,
        babyId: '',
        babyProfile: null,
        onboardingRequired: false,
        membershipPending: false,
        role: null,
        theme: 'A',
    },
});
