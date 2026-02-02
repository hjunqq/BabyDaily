// Compare raw SQL result with API response

async function run() {
    const API_URL = 'http://localhost:3000';

    // Login
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const { access_token } = await loginRes.json();
    const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' };

    // Get baby
    const familiesRes = await fetch(`${API_URL}/families/my`, { headers });
    const families = await familiesRes.json();
    const babiesRes = await fetch(`${API_URL}/babies/family/${families[0]?.id}`, { headers });
    const babies = await babiesRes.json();
    const babyId = babies[0]?.id;

    // Get trend
    const trendRes = await fetch(`${API_URL}/records/baby/${babyId}/trend?days=10`, { headers });
    const trendData = await trendRes.json();

    console.log('=== API Response ===');
    trendData.filter(d => d.milkMl > 0).forEach(d => {
        console.log(`${d.date}: ${d.milkMl}ml`);
    });

    // Get all records and calculate manually
    const recordsRes = await fetch(`${API_URL}/records/baby/${babyId}?limit=50`, { headers });
    const records = await recordsRes.json();

    // Group by the SQL formula: TO_CHAR((UTC + 8h - 8h), 'YYYY-MM-DD') = TO_CHAR(UTC, 'YYYY-MM-DD')
    const bySqlFormula = {};
    records.filter(r => r.type === 'FEED' && r.details?.subtype !== 'SOLID').forEach(r => {
        const utc = new Date(r.time);
        // Simulate: (UTC + 8h) - 8h = UTC
        const dateLabel = utc.toISOString().slice(0, 10);
        const amount = r.details?.amount || 0;
        bySqlFormula[dateLabel] = (bySqlFormula[dateLabel] || 0) + amount;
    });

    console.log('\n=== Expected (SQL formula simulation) ===');
    Object.entries(bySqlFormula).sort().forEach(([date, sum]) => {
        console.log(`${date}: ${sum}ml`);
    });

    // Compare
    console.log('\n=== Comparison ===');
    const apiByDate = {};
    trendData.forEach(d => { apiByDate[d.date] = d.milkMl; });

    Object.keys(bySqlFormula).sort().forEach(date => {
        const expected = bySqlFormula[date] || 0;
        const got = apiByDate[date] || 0;
        const status = expected === got ? '✓' : `✗ (diff=${expected - got})`;
        console.log(`${date}: SQL=${expected}ml, API=${got}ml ${status}`);
    });
}

run().catch(console.error);
