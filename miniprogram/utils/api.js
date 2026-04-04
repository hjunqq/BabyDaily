const API_URL = 'https://baby.hydrosim.cn/api';

const request = ({ url, method = 'GET', data, token }) => new Promise((resolve, reject) => {
    wx.request({
        url: API_URL + url,
        method,
        data,
        timeout: 15000,
        header: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        success: (res) => {
            const { statusCode, data: resData } = res;
            if (statusCode >= 200 && statusCode < 300) {
                resolve(resData);
                return;
            }
            const error = new Error(resData?.message || `Request failed: ${statusCode}`);
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

const saveSession = ({ token, user, babyId, baby }) => {
    if (token) wx.setStorageSync('access_token', token);
    if (user) wx.setStorageSync('current_user', user);
    if (babyId) wx.setStorageSync('current_baby_id', babyId);
    if (baby) wx.setStorageSync('current_baby', baby);
};

const clearSession = () => {
    wx.removeStorageSync('access_token');
    wx.removeStorageSync('current_user');
    wx.removeStorageSync('current_baby_id');
    wx.removeStorageSync('current_baby');
};

const getStoredToken = () => wx.getStorageSync('access_token') || '';
const getCurrentBabyId = () => wx.getStorageSync('current_baby_id') || '';

// 一次调用完成：登录 + 获取家庭 + 获取宝宝
const bootstrap = async (method, code) => {
    const data = { method };
    if (code) data.code = code;
    return new Promise((resolve, reject) => {
        wx.request({
            url: API_URL + '/auth/bootstrap',
            method: 'POST',
            data,
            timeout: 15000,
            header: { 'Content-Type': 'application/json' },
            success: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(res.data);
                } else {
                    const msg = res.data?.message || `status ${res.statusCode}`;
                    reject(new Error(`Bootstrap failed: ${msg}`));
                }
            },
            fail: (err) => reject(err),
        });
    });
};

const initSession = async () => {
    // 如果已有 token，直接返回缓存
    const cached = getStoredToken();
    if (cached) {
        const user = wx.getStorageSync('current_user') || null;
        const babyId = getCurrentBabyId();
        const baby = wx.getStorageSync('current_baby') || null;
        if (babyId) return { token: cached, user, babyId, baby };
    }

    // 优先 dev 登录；未来配好微信凭证后可改为 wechat
    let res;
    try {
        res = await bootstrap('dev');
    } catch (devErr) {
        console.warn('[Auth] Dev bootstrap failed:', devErr.message);
        try {
            const loginRes = await wxLogin();
            res = await bootstrap('wechat', loginRes.code);
        } catch (wxErr) {
            throw new Error('登录失败：请检查网络连接');
        }
    }

    const { access_token, user, baby } = res;
    const session = { token: access_token, user, babyId: baby.id, baby };
    saveSession(session);
    console.log('[Init] babyId:', baby.id, 'baby:', baby.name);
    return session;
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
    getStoredToken,
    getCurrentBabyId,
    clearSession,
};
