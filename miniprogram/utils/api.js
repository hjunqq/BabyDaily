const API_URL = 'https://baby.hydrosim.cn/api';
const BOOTSTRAP_VERSION = 5;
const AUTH_CONTEXT_KEY = 'auth_context';

const request = ({ url, method = 'GET', data, token }) => new Promise((resolve, reject) => {
    wx.request({
        url: API_URL + url,
        method,
        data,
        timeout: 15000,
        header: Object.assign(
            { 'Content-Type': 'application/json' },
            token ? { Authorization: 'Bearer ' + token } : {}
        ),
        success: (res) => {
            const { statusCode, data: resData } = res;
            if (statusCode >= 200 && statusCode < 300) {
                resolve(resData);
                return;
            }
            const error = new Error((resData && resData.message) || ('Request failed: ' + statusCode));
            error.statusCode = statusCode;
            reject(error);
        },
        fail: (err) => {
            console.error(`[API] ${method} ${url} failed:`, err.errMsg || err);
            reject(err);
        },
    });
});

const wxLogin = () => new Promise((resolve, reject) => {
    wx.login({ success: resolve, fail: reject });
});

const saveSession = ({ token, user, family, babyId, baby, onboardingRequired, membershipPending, role }) => {
    if (token) wx.setStorageSync('access_token', token);
    if (user) wx.setStorageSync('current_user', user);
    if (family) wx.setStorageSync('current_family', family);
    if (babyId) wx.setStorageSync('current_baby_id', babyId);
    if (baby) wx.setStorageSync('current_baby', baby);
    wx.setStorageSync('session_context', {
        family: family || null,
        baby: baby || null,
        onboardingRequired: !!onboardingRequired,
        membershipPending: !!membershipPending,
        role: role || null,
    });
};

const clearSession = () => {
    wx.removeStorageSync('access_token');
    wx.removeStorageSync('current_user');
    wx.removeStorageSync('current_family');
    wx.removeStorageSync('current_baby_id');
    wx.removeStorageSync('current_baby');
    wx.removeStorageSync('session_context');
};

const setAuthContext = (authContext) => {
    if (authContext) {
        wx.setStorageSync(AUTH_CONTEXT_KEY, authContext);
    }
};

const getAuthContext = () => wx.getStorageSync(AUTH_CONTEXT_KEY) || null;

const clearAuthContext = () => {
    wx.removeStorageSync(AUTH_CONTEXT_KEY);
    wx.removeStorageSync('bootstrap_version');
};

const getStoredToken = () => wx.getStorageSync('access_token') || '';
const getCurrentBabyId = () => wx.getStorageSync('current_baby_id') || '';
const getCurrentFamily = () => wx.getStorageSync('current_family') || null;
const getSessionContext = () => wx.getStorageSync('session_context') || {};

const mapBootstrapResponseToSession = (res, fallbackToken) => ({
    token: res.access_token || fallbackToken || '',
    user: res.user || null,
    family: res.family || null,
    babyId: res.baby?.id || '',
    baby: res.baby || null,
    onboardingRequired: !!res.onboardingRequired,
    membershipPending: !!res.membershipPending,
    role: res.role || null,
});

const getSettings = async () => {
    const token = getStoredToken();
    const family = getCurrentFamily();
    const familyQuery = family?.id ? `?familyId=${encodeURIComponent(family.id)}` : '';
    if (!token) {
        throw new Error('No active session');
    }
    return request({
        url: `/settings${familyQuery}`,
        method: 'GET',
        token,
    });
};

const bootstrap = async (method, payload) => {
    const data = { method };
    if (method === 'wechat' && payload) {
        data.code = payload;
    }
    if (method === 'admin' && payload) {
        data.username = payload.username;
        data.password = payload.password;
    }

    return request({
        url: '/auth/bootstrap',
        method: 'POST',
        data,
    });
};

const refreshSession = async () => {
    const token = getStoredToken();
    if (!token) {
        throw new Error('No active session');
    }

    const res = await request({
        url: '/auth/session',
        method: 'GET',
        token,
    });

    const session = {
        token,
        user: res.user,
        family: res.family || null,
        babyId: res.baby?.id || '',
        baby: res.baby || null,
        onboardingRequired: !!res.onboardingRequired,
        membershipPending: !!res.membershipPending,
        role: res.role || null,
    };
    saveSession(session);
    return session;
};

const loginWithWechat = async () => {
    setAuthContext({ method: 'wechat' });
    clearSession();
    const loginRes = await wxLogin();
    const res = await bootstrap('wechat', loginRes.code);
    const session = mapBootstrapResponseToSession(res);
    saveSession(session);
    wx.setStorageSync('bootstrap_version', BOOTSTRAP_VERSION);
    return session;
};

const loginWithAdmin = async (username, password) => {
    setAuthContext({ method: 'admin', username, password });
    clearSession();
    const res = await bootstrap('admin', { username, password });
    const session = mapBootstrapResponseToSession(res);
    saveSession(session);
    wx.setStorageSync('bootstrap_version', BOOTSTRAP_VERSION);
    return session;
};

const initSession = async () => {
    const cached = getStoredToken();
    const ver = wx.getStorageSync('bootstrap_version') || 0;
    if (cached && ver >= BOOTSTRAP_VERSION) {
        const user = wx.getStorageSync('current_user') || null;
        const babyId = getCurrentBabyId();
        const baby = wx.getStorageSync('current_baby') || null;
        const family = getCurrentFamily();
        const session = getSessionContext();
        return {
            token: cached,
            user,
            family,
            babyId,
            baby,
            onboardingRequired: !!session.onboardingRequired,
            membershipPending: !!session.membershipPending,
            role: session.role || null,
        };
    }

    const authContext = getAuthContext();
    if (!authContext || !authContext.method) {
        clearSession();
        return null;
    }

    clearSession();

    try {
        if (authContext.method === 'wechat') {
            return await loginWithWechat();
        }
        if (authContext.method === 'admin') {
            return await loginWithAdmin(authContext.username || '', authContext.password || '');
        }
        throw new Error('Unsupported auth method');
    } catch (err) {
        // If the backend rejects the stored credentials (401/403) or the credentials
        // are otherwise unusable, drop the auth context so we don't loop on next launch.
        const sc = err && err.statusCode;
        if (sc === 401 || sc === 403 || !sc) {
            clearAuthContext();
        }
        const e = new Error('AUTH_REQUIRED');
        e.cause = err;
        throw e;
    }
};

const redirectToLogin = () => {
    const pages = (typeof getCurrentPages === 'function') ? getCurrentPages() : [];
    const current = pages.length > 0 ? pages[pages.length - 1].route : '';
    if (current === 'pages/login/login') return;
    wx.reLaunch({ url: '/pages/login/login' });
};

const authedRequest = async (url, options = {}) => {
    const token = options.token || getStoredToken();
    try {
        return await request({ url, method: options.method, data: options.data, token });
    } catch (err) {
        if (err.statusCode === 401 || err.statusCode === 403) {
            const oldBabyId = getCurrentBabyId();
            clearSession();
            let session;
            try {
                session = await initSession();
            } catch (reauthErr) {
                redirectToLogin();
                throw reauthErr;
            }
            if (!session || !session.token) {
                redirectToLogin();
                throw new Error('AUTH_REQUIRED');
            }
            let retryUrl = url;
            if (oldBabyId && session.babyId && oldBabyId !== session.babyId) {
                retryUrl = url.replace(oldBabyId, session.babyId);
            }
            return request({ url: retryUrl, method: options.method, data: options.data, token: session.token });
        }
        throw err;
    }
};

const loginWithInviteCode = async (code) => {
    if (!code) {
        throw new Error('请输入邀请码');
    }

    await loginWithWechat();
    await authedRequest('/families/join', {
        method: 'POST',
        data: { code },
    });
    return refreshSession();
};

const getFamilies = async () => authedRequest('/families/my');

const getMembers = async (familyId) => authedRequest(`/families/${familyId}/members`);

const getPendingMembers = async (familyId) => authedRequest(`/families/${familyId}/members/pending`);

const createInvite = async (familyId, role) => authedRequest(`/families/${familyId}/invites`, {
    method: 'POST',
    data: { role: role || 'MEMBER' },
});

const approveMember = async (familyId, memberId) => authedRequest(`/families/${familyId}/members/${memberId}/approve`, {
    method: 'POST',
});

const rejectMember = async (familyId, memberId) => authedRequest(`/families/${familyId}/members/${memberId}/reject`, {
    method: 'POST',
});

const logout = () => {
    clearSession();
    clearAuthContext();
};

module.exports = {
    API_URL,
    request,
    authedRequest,
    initSession,
    refreshSession,
    loginWithWechat,
    loginWithInviteCode,
    loginWithAdmin,
    getSettings,
    getStoredToken,
    getCurrentBabyId,
    getCurrentFamily,
    getSessionContext,
    clearSession,
    getFamilies,
    getMembers,
    getPendingMembers,
    createInvite,
    approveMember,
    rejectMember,
    getAuthContext,
    logout,
};
