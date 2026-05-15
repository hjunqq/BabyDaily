const { authedRequest, getCurrentBabyId } = require('../../utils/api');

module.exports = {
    fetchRecords: async (babyId) => {
        const targetId = babyId || getCurrentBabyId();
        return authedRequest(`/records/baby/${targetId}?limit=20`);
    },
    fetchSummary: async (babyId, dayStartHour) => {
        const targetId = babyId || getCurrentBabyId();
        const query = Number.isFinite(dayStartHour) ? `?dayStartHour=${dayStartHour}` : '';
        return authedRequest(`/records/baby/${targetId}/summary${query}`);
    },
};
