const app = getApp();
const { authedRequest, refreshSession } = require('../../utils/api');

Page({
    data: {
        // Steps: 'invite' | 'pending' | 'approved'
        step: 'invite',
        inviteCode: '',
        loading: false,
        error: '',
        familyName: '',
        // polling for approval
        pollTimer: null,
    },

    onLoad() {
        // If already pending, go straight to pending screen
        const session = app.globalData;
        if (session.membershipPending) {
            this.setData({
                step: 'pending',
                familyName: session.family ? session.family.name : '',
            });
            this.startPolling();
        }
    },

    onShow() {
        if (!app.globalData.onboardingRequired && app.globalData.babyId) {
            wx.switchTab({ url: '/pages/home/home' });
        }
    },

    onUnload() {
        this.stopPolling();
    },

    onHide() {
        this.stopPolling();
    },

    onInviteInput(e) {
        this.setData({ inviteCode: e.detail.value.toUpperCase() });
    },

    async submitInvite() {
        const code = (this.data.inviteCode || '').trim();
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
            const result = await authedRequest('/families/join', {
                method: 'POST',
                data: { code },
            });

            const familyName = (result.family && result.family.name) || '';
            this.setData({
                step: 'pending',
                familyName,
                loading: false,
            });

            // Update global state
            app.globalData.membershipPending = true;
            app.globalData.family = result.family || null;

            this.startPolling();
        } catch (err) {
            console.error('[Onboarding] join failed', err);
            let msg = '加入失败，请稍后重试';
            if (err && err.message) {
                if (err.message.includes('Invalid')) msg = '邀请码无效';
                else if (err.message.includes('expired')) msg = '邀请码已过期';
                else if (err.message.includes('used')) msg = '邀请码已被使用';
                else if (err.message.includes('already')) msg = '您已是该家庭成员';
                else if (err.message.includes('pending')) msg = '您的申请正在等待审批';
                else msg = err.message;
            }
            this.setData({ error: msg, loading: false });
        }
    },

    startPolling() {
        this.stopPolling();
        const timer = setInterval(() => this.checkApproval(), 5000);
        this.setData({ pollTimer: timer });
    },

    stopPolling() {
        if (this.data.pollTimer) {
            clearInterval(this.data.pollTimer);
            this.setData({ pollTimer: null });
        }
    },

    async checkApproval() {
        try {
            const session = await refreshSession();
            app.applySession(session);

            if (!session.onboardingRequired && session.babyId) {
                // Approved and has baby context
                this.stopPolling();
                wx.switchTab({ url: '/pages/home/home' });
            } else if (session.membershipPending) {
                // Still pending
            } else if (session.onboardingRequired && !session.membershipPending) {
                // Rejected — membership was removed
                this.stopPolling();
                this.setData({
                    step: 'invite',
                    error: '您的加入申请未通过，请联系家长获取新的邀请码',
                    familyName: '',
                });
                app.globalData.membershipPending = false;
            }
        } catch (err) {
            console.error('[Onboarding] poll failed', err);
        }
    },

    async manualRefresh() {
        this.setData({ loading: true });
        await this.checkApproval();
        this.setData({ loading: false });
    },
});
