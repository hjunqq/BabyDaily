const app = getApp();
const {
    loginWithInviteCode,
    loginWithAdmin,
    loginWithWechat,
    logout,
} = require('../../utils/api');

Page({
    data: {
        mode: 'invite',
        inviteCode: '',
        username: '',
        password: '',
        loading: false,
        error: '',
    },

    onLoad() {
        const ready = app.readyPromise || Promise.resolve();
        ready
            .then(() => this.routeIfReady())
            .catch((err) => {
                console.warn('[Login] init failed:', err.message || err);
            });
    },

    onShow() {
        this.routeIfReady();
    },

    routeIfReady() {
        if (!app.globalData.token) {
            return;
        }
        if (app.globalData.onboardingRequired) {
            wx.reLaunch({ url: '/pages/onboarding/onboarding' });
            return;
        }
        if (app.globalData.babyId) {
            wx.switchTab({ url: '/pages/home/home' });
        }
    },

    switchMode(e) {
        const mode = e.currentTarget.dataset.mode;
        this.setData({ mode, error: '' });
    },

    onInviteInput(e) {
        this.setData({ inviteCode: (e.detail.value || '').toUpperCase(), error: '' });
    },

    onUsernameInput(e) {
        this.setData({ username: e.detail.value || '', error: '' });
    },

    onPasswordInput(e) {
        this.setData({ password: e.detail.value || '', error: '' });
    },

    async submitInviteLogin() {
        const code = (this.data.inviteCode || '').trim().toUpperCase();
        if (!code) {
            this.setData({ error: '请输入邀请码' });
            return;
        }
        if (code.length < 6) {
            this.setData({ error: '邀请码格式不正确' });
            return;
        }

        this.setData({ loading: true, error: '' });
        try {
            logout();
            const session = await loginWithInviteCode(code);
            app.applySession(session);
            await app.loadSettings();
            this.routeIfReady();
        } catch (err) {
            console.error('[Login] invite login failed', err);
            let message = '加入失败，请稍后重试';
            if (err && err.message) {
                if (err.message.includes('Invalid')) message = '邀请码无效';
                else if (err.message.includes('expired')) message = '邀请码已过期';
                else if (err.message.includes('used')) message = '邀请码已被使用';
                else if (err.message.includes('pending')) message = '申请已提交，请等待审批';
                else if (err.message.includes('already')) message = '你已经在该家庭中';
                else message = err.message;
            }
            this.setData({ error: message });
        } finally {
            this.setData({ loading: false });
        }
    },

    async submitWechatLogin() {
        this.setData({ loading: true, error: '' });
        try {
            logout();
            const session = await loginWithWechat();
            app.applySession(session);
            await app.loadSettings();
            if (session.onboardingRequired) {
                wx.reLaunch({ url: '/pages/onboarding/onboarding' });
                return;
            }
            if (session.babyId) {
                wx.switchTab({ url: '/pages/home/home' });
                return;
            }
            // Logged in but not yet in a family — keep them here and surface invite-code mode.
            this.setData({
                mode: 'invite',
                error: '当前微信尚未加入家庭，请输入邀请码加入',
            });
        } catch (err) {
            console.error('[Login] wechat login failed', err);
            this.setData({
                error: (err && err.message) || '微信登录失败，请重试',
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    async submitAdminLogin() {
        const username = (this.data.username || '').trim();
        const password = this.data.password || '';
        if (!username || !password) {
            this.setData({ error: '请输入测试用户名和密码' });
            return;
        }

        this.setData({ loading: true, error: '' });
        try {
            logout();
            const session = await loginWithAdmin(username, password);
            app.applySession(session);
            await app.loadSettings();
            if (session.family) {
                wx.reLaunch({ url: '/pages/family/family' });
                return;
            }
            this.routeIfReady();
        } catch (err) {
            console.error('[Login] admin login failed', err);
            this.setData({
                error: (err && err.message) || '登录失败，请检查用户名和密码',
            });
        } finally {
            this.setData({ loading: false });
        }
    },
});
