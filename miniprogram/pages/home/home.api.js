const API_URL = 'http://localhost:3000';

const request = (url, options = {}) => {
    return wx.request({
        url: API_URL + url,
        method: options.method || 'GET',
        data: options.data,
        header: {
            'Content-Type': 'application/json',
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        success: options.success,
        fail: options.fail,
        complete: options.complete,
    });
};

module.exports = {
    fetchRecords: (babyId, cb) => {
        request(`/records/baby/${babyId}?limit=5`, {
            success: (res) => cb(null, res.data),
            fail: (err) => cb(err),
        });
    },
    fetchSummary: (babyId, cb) => {
        request(`/records/baby/${babyId}/summary`, {
            success: (res) => cb(null, res.data),
            fail: (err) => cb(err),
        });
    }
};
