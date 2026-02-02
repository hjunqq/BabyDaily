// Comprehensive debug - show raw result from API

async function run() {
    const API_URL = 'http://localhost:3000';

    // 1. Login
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.access_token;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Get Family and Baby
    const familiesRes = await fetch(`${API_URL}/families/my`, { headers });
    const families = await familiesRes.json();
    const babiesRes = await fetch(`${API_URL}/babies/family/${families[0]?.id}`, { headers });
    const babies = await babiesRes.json();
    const babyId = babies[0]?.id;

    // Fetch trend
    console.log('Fetching trend from:', `${API_URL}/records/baby/${babyId}/trend?days=10`);
    const trendRes = await fetch(`${API_URL}/records/baby/${babyId}/trend?days=10`, { headers });
    const trendData = await trendRes.json();

    console.log('\n--- Full Trend Response ---');
    console.log(JSON.stringify(trendData, null, 2));

    // Also get all records to manually verify
    console.log('\n--- All Records (for manual verification) ---');
    const recordsRes = await fetch(`${API_URL}/records/baby/${babyId}?limit=50`, { headers });
    const records = await recordsRes.json();

    // Group by calendar date vs logical date
    const byCalendar = {};
    const byLogical8 = {};

    records.filter(r => r.type === 'FEED').forEach(r => {
        const utc = new Date(r.time);
        const amount = r.details?.amount || 0;

        // Calendar date (based on China Time +8)
        const chinaTime = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
        const calendarDate = chinaTime.toISOString().slice(0, 10);
        byCalendar[calendarDate] = (byCalendar[calendarDate] || 0) + amount;

        // Logical date with dayStart=8
        // Formula: (UTC + 8h - 8h) but we need to shift 8 hours back from midnight
        // Actually: If china time hour < 8, it belongs to previous logical day
        const chinaHour = chinaTime.getUTCHours();
        let logicalDate;
        if (chinaHour < 8) {
            // Before 8 AM, belongs to previous day
            const prevDay = new Date(chinaTime.getTime() - 24 * 60 * 60 * 1000);
            logicalDate = prevDay.toISOString().slice(0, 10);
        } else {
            logicalDate = calendarDate;
        }
        byLogical8[logicalDate] = (byLogical8[logicalDate] || 0) + amount;
    });

    console.log('\n--- Grouped by Calendar Date (dayStart=0) ---');
    Object.entries(byCalendar).sort().forEach(([date, sum]) => {
        console.log(`${date}: ${sum}ml`);
    });

    console.log('\n--- Grouped by Logical Date (dayStart=8) ---');
    Object.entries(byLogical8).sort().forEach(([date, sum]) => {
        console.log(`${date}: ${sum}ml`);
    });

    // Compare with API response
    console.log('\n--- Comparison ---');
    const apiByDate = {};
    trendData.forEach(d => { apiByDate[d.date] = d.milkMl; });

    ['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'].forEach(date => {
        const expected = byLogical8[date] || 0;
        const got = apiByDate[date] || 0;
        const status = expected === got ? '✓ MATCH' : '✗ MISMATCH';
        console.log(`${date}: Expected ${expected}ml, API ${got}ml => ${status}`);
    });
}

run().catch(console.error);
