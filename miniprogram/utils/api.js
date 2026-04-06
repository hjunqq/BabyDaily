const API_URL = 'https://baby.hydrosim.cn/api';
const BOOTSTRAP_VERSION = 3;

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

const saveSession = ({ token, user, family, babyId, baby, onboardingRequired }) => {
    if (token) wx.setStorageSync('access_token', token);
    if (user) wx.setStorageSync('current_user', user);
    if (family) wx.setStorageSync('current_family', family);
    if (babyId) wx.setStorageSync('current_baby_id', babyId);
    if (baby) wx.setStorageSync('current_baby', baby);
    wx.setStorageSync('session_context', {
        family: family || null,
        baby: baby || null,
        onboardingRequired: !!onboardingRequired,
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

const getStoredToken = () => wx.getStorageSync('access_token') || '';
const getCurrentBabyId = () => wx.getStorageSync('current_baby_id') || '';
const getCurrentFamily = () => wx.getStorageSync('current_family') || null;
const getSessionContext = () => wx.getStorageSync('session_context') || {};

const bootstrap = async (method, payload) => {
    const data = { method };
    if (method === 'wechat' && payload) {
        data.code = payload;
    }
    if (method === 'pin' && payload) {
        data.pin = payload;
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
        };
    }

    clearSession();

    try {
        const loginRes = await wxLogin();
        const res = await bootstrap('wechat', loginRes.code);
        const { access_token, user, family, baby, onboardingRequired, membershipPending, role } = res;
        const session = {
            token: access_token,
            user,
            family: family || null,
            babyId: baby?.id || '',
            baby: baby || null,
            onboardingRequired: !!onboardingRequired,
            membershipPending: !!membershipPending,
            role: role || null,
        };
        saveSession(session);
        wx.setStorageSync('bootstrap_version', BOOTSTRAP_VERSION);
        return session;
    } catch (err) {
        throw new Error('登录失败，请检查网络连接后重试');
    }
};

const authedRequest = async (url, options = {}) => {
    const token = options.token || getStoredToken();
    try {
        return await request({ url, method: options.method, data: options.data, token });
    } catch (err) {
        if (err.statusCode === 401) {
            clearSession();
            const { token: newToken } = await initSession();
            return request({ url, method: options.method, data: options.data, token: newToken });
        }
        throw err;
    }
};

module.exports = {
    API_URL,
    request,
    authedRequest,
    initSession,
    refreshSession,
    getStoredToken,
    getCurrentBabyId,
    getCurrentFamily,
    getSessionContext,
    clearSession,
};
