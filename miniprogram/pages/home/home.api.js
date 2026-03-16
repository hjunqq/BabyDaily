const { authedRequest, getCurrentBabyId } = require('../../utils/api');

module.exports = {
    fetchRecords: async (babyId) => {
        const targetId = babyId || getCurrentBabyId();
        return authedRequest(`/records/baby/${targetId}?limit=5`);
    },
    fetchSummary: async (babyId) => {
        const targetId = babyId || getCurrentBabyId();
        return authedRequest(`/records/baby/${targetId}/summary`);
    }
};
