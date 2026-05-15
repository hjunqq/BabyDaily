const app = getApp();
const {
    getFamilies,
    getMembers,
    getPendingMembers,
    createInvite,
    approveMember,
    rejectMember,
    logout,
} = require('../../utils/api');

const ROLE_LABELS = {
    OWNER: '所有者',
    GUARDIAN: '监护人',
    MEMBER: '成员',
    VIEWER: '访客',
};

Page({
    data: {
        loading: true,
        error: '',
        family: null,
        members: [],
        pendingMembers: [],
        inviteRole: 'MEMBER',
        latestInviteCode: '',
        latestInviteRoleLabel: '',
        canManage: false,
        actionLoading: false,
        currentRole: '',
        currentRoleLabel: '',
    },

    onLoad() {
        const ready = app.readyPromise || Promise.resolve();
        ready
            .then(() => {
                if (!app.ensureLoggedIn()) {
                    return;
                }
                this.loadData();
            })
            .catch((err) => {
                console.error('[Family] init failed', err);
                this.setData({ loading: false, error: err.message || '初始化失败' });
            });
    },

    onShow() {
        if (app.globalData.token) {
            this.loadData();
        }
    },

    async loadData() {
        const familyId = app.globalData.family && app.globalData.family.id;
        if (!familyId) {
            this.setData({
                loading: false,
                error: '当前账号还没有可管理的家庭',
            });
            return;
        }

        this.setData({ loading: true, error: '' });
        try {
            const [families, members, pendingMembers] = await Promise.all([
                getFamilies(),
                getMembers(familyId),
                getPendingMembers(familyId).catch(() => []),
            ]);
            const family = (families || []).find((item) => item.id === familyId) || app.globalData.family;
            const currentRole = app.globalData.role || '';
            const canManage = currentRole === 'OWNER' || currentRole === 'GUARDIAN';
            this.setData({
                family,
                members: (members || []).map((member) => ({
                    ...member,
                    displayName: (member.user && member.user.nickname) || member.user_id,
                    roleLabel: ROLE_LABELS[member.role] || member.role || '成员',
                    statusLabel: member.status === 'ACTIVE' ? '已加入' : '待审核',
                })),
                pendingMembers: (pendingMembers || []).map((member) => ({
                    ...member,
                    displayName: (member.user && member.user.nickname) || member.user_id,
                    roleLabel: ROLE_LABELS[member.role] || member.role || '成员',
                })),
                canManage,
                currentRole,
                currentRoleLabel: ROLE_LABELS[currentRole] || currentRole || '成员',
                loading: false,
            });
        } catch (err) {
            console.error('[Family] load failed', err);
            this.setData({
                loading: false,
                error: (err && err.message) || '加载家庭管理失败',
            });
        }
    },

    selectInviteRole(e) {
        this.setData({ inviteRole: e.currentTarget.dataset.role });
    },

    goHome() {
        wx.switchTab({ url: '/pages/home/home' });
    },

    switchAccount() {
        logout();
        app.applySession(null);
        app.applySettings(null);
        wx.reLaunch({ url: '/pages/login/login' });
    },

    async handleCreateInvite() {
        const familyId = app.globalData.family && app.globalData.family.id;
        if (!familyId) {
            return;
        }
        this.setData({ actionLoading: true });
        try {
            const invite = await createInvite(familyId, this.data.inviteRole);
            this.setData({
                latestInviteCode: invite.code || '',
                latestInviteRoleLabel: ROLE_LABELS[invite.role] || invite.role || '',
            });
            wx.showToast({ title: '邀请码已生成', icon: 'success' });
        } catch (err) {
            wx.showToast({
                title: (err && err.message) || '生成失败',
                icon: 'none',
            });
        } finally {
            this.setData({ actionLoading: false });
        }
    },

    copyInviteCode() {
        if (!this.data.latestInviteCode) {
            return;
        }
        wx.setClipboardData({
            data: this.data.latestInviteCode,
            success: () => wx.showToast({ title: '已复制邀请码', icon: 'success' }),
        });
    },

    async handleApprove(e) {
        const familyId = app.globalData.family && app.globalData.family.id;
        const memberId = e.currentTarget.dataset.memberId;
        if (!familyId || !memberId) {
            return;
        }
        this.setData({ actionLoading: true });
        try {
            await approveMember(familyId, memberId);
            wx.showToast({ title: '已批准', icon: 'success' });
            await this.loadData();
        } catch (err) {
            wx.showToast({
                title: (err && err.message) || '批准失败',
                icon: 'none',
            });
        } finally {
            this.setData({ actionLoading: false });
        }
    },

    handleReject(e) {
        const memberId = e.currentTarget.dataset.memberId;
        const nickname = e.currentTarget.dataset.nickname || '该成员';
        wx.showModal({
            title: '拒绝加入',
            content: `确认拒绝 ${nickname} 的加入申请吗？`,
            success: async (res) => {
                if (!res.confirm) {
                    return;
                }
                const familyId = app.globalData.family && app.globalData.family.id;
                if (!familyId || !memberId) {
                    return;
                }
                this.setData({ actionLoading: true });
                try {
                    await rejectMember(familyId, memberId);
                    wx.showToast({ title: '已拒绝', icon: 'success' });
                    await this.loadData();
                } catch (err) {
                    wx.showToast({
                        title: (err && err.message) || '拒绝失败',
                        icon: 'none',
                    });
                } finally {
                    this.setData({ actionLoading: false });
                }
            },
        });
    },
});
