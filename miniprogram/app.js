const { initSession, getSettings } = require('./utils/api');

App({
    onLaunch() {
        this.readyPromise = initSession()
            .then((session) => {
                this.applySession(session);
                if (!session || !session.token) {
                    this.applySettings(null);
                    return null;
                }
                return this.loadSettings().then(() => session);
            })
            .then((session) => {
                if (session && session.onboardingRequired) {
                    setTimeout(() => {
                        wx.reLaunch({ url: '/pages/onboarding/onboarding' });
                    }, 0);
                }
                return session;
            })
            .catch((err) => {
                console.error('[App] Login failed:', err.message || err);
                this.applySession(null);
                this.applySettings(null);
                // Don't re-throw: callers (page onLoad) would show a blocking modal.
                // Instead route the user to login where they can re-authenticate.
                setTimeout(() => {
                    wx.reLaunch({ url: '/pages/login/login' });
                }, 0);
                return null;
            });
    },

    loadSettings() {
        return getSettings()
            .then((settings) => {
                this.applySettings(settings);
                return settings;
            })
            .catch((err) => {
                console.warn('[App] Load settings failed:', err.message || err);
                this.applySettings(null);
                return null;
            });
    },

    applySession(session) {
        const next = session || {};
        this.globalData.token = next.token || '';
        this.globalData.userInfo = next.user || null;
        this.globalData.family = next.family || null;
        this.globalData.babyId = next.babyId || '';
        this.globalData.babyProfile = next.baby || null;
        this.globalData.onboardingRequired = !!next.onboardingRequired;
        this.globalData.membershipPending = !!next.membershipPending;
        this.globalData.role = next.role || null;
    },

    applySettings(settings) {
        this.globalData.settings = settings || null;
        this.globalData.dayStartHour = settings?.dayStartHour || 0;
    },

    ensureLoggedIn() {
        if (!this.globalData.token) {
            wx.reLaunch({ url: '/pages/login/login' });
            return false;
        }
        return true;
    },

    ensureBabyContext() {
        if (!this.ensureLoggedIn()) {
            return false;
        }
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
        settings: null,
        dayStartHour: 0,
        theme: 'A',
    },
});
