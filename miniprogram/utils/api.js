const API_URL = 'http://localhost:3000';

const request = ({ url, method = 'GET', data, token }) => new Promise((resolve, reject) => {
    wx.request({
        url: API_URL + url,
        method,
        data,
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
        fail: (err) => reject(err),
    });
});

const wxLogin = () => new Promise((resolve, reject) => {
    wx.login({
        success: resolve,
        fail: reject,
    });
});

const loginWithWechat = async () => {
    const loginRes = await wxLogin();
    return request({
        url: '/auth/login/wechat',
        method: 'POST',
        data: { code: loginRes.code },
    });
};

const loginDev = () => request({ url: '/auth/login/dev', method: 'POST' });

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

const ensureAuth = async () => {
    let token = getStoredToken();
    let user = wx.getStorageSync('current_user') || null;

    if (token) {
        return { token, user };
    }

    try {
        const res = await loginWithWechat();
        token = res.access_token;
        user = res.user;
    } catch (err) {
        console.warn('WeChat login failed, fallback to dev login', err);
        const res = await loginDev();
        token = res.access_token;
        user = res.user;
    }

    saveSession({ token, user });
    return { token, user };
};

const ensureDefaultBaby = async (token) => {
    let families = await request({ url: '/families/my', token });
    if (!Array.isArray(families) || families.length === 0) {
        const family = await request({
            url: '/families',
            method: 'POST',
            data: { name: 'Sakura Family' },
            token,
        });
        families = [family];
    }
    const familyId = families[0].id;

    let babies = await request({ url: `/babies/family/${familyId}`, token });
    let baby;
    if (!Array.isArray(babies) || babies.length === 0) {
        baby = await request({
            url: '/babies',
            method: 'POST',
            data: {
                family_id: familyId,
                name: 'Sakura',
                gender: 'FEMALE',
                birthday: new Date().toISOString(),
            },
            token,
        });
    } else {
        baby = babies[0];
    }

    const babyId = baby.id;
    saveSession({ babyId, baby });
    return { babyId, baby };
};

const initSession = async () => {
    const { token, user } = await ensureAuth();
    const { babyId, baby } = await ensureDefaultBaby(token);
    saveSession({ token, user, babyId, baby });
    return { token, user, babyId, baby };
};

const authedRequest = async (url, options = {}) => {
    const token = options.token || getStoredToken();
    try {
        return await request({
            url,
            method: options.method,
            data: options.data,
            token,
        });
    } catch (err) {
        if (err.statusCode === 401) {
            clearSession();
            const { token: newToken } = await initSession();
            return request({
                url,
                method: options.method,
                data: options.data,
                token: newToken,
            });
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
