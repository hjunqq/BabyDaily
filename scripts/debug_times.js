// Debug SQL output directly

async function run() {
    const API_URL = 'http://localhost:3000';  // LOCAL dev server

    console.log('Debugging SQL output...');

    // 1. Login
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.access_token;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Get settings
    const settingsRes = await fetch(`${API_URL}/settings`, { headers });
    const settings = await settingsRes.json();
    console.log('Current dayStartHour:', settings.dayStartHour);

    // 3. Get all records to verify times
    const familiesRes = await fetch(`${API_URL}/families/my`, { headers });
    const families = await familiesRes.json();
    const babiesRes = await fetch(`${API_URL}/babies/family/${families[0]?.id}`, { headers });
    const babies = await babiesRes.json();
    const babyId = babies[0]?.id;

    const recordsRes = await fetch(`${API_URL}/records/baby/${babyId}?limit=50`, { headers });
    const records = await recordsRes.json();

    console.log('\n--- Sample Records with Times ---');
    // Filter to show relevant records around Feb 1 04:00
    const relevant = records.filter(r => {
        const time = new Date(r.time);
        return time >= new Date('2026-01-31T00:00:00Z') && time <= new Date('2026-02-02T10:00:00Z');
    }).sort((a, b) => new Date(a.time) - new Date(b.time));

    relevant.forEach(r => {
        const utcTime = new Date(r.time);
        const chinaTime = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000);
        const logicalDate8 = new Date(utcTime.getTime() + (8 - 8) * 60 * 60 * 1000); // With dayStart=8
        console.log(
            `UTC: ${utcTime.toISOString().slice(0, 19)}`,
            `China: ${chinaTime.toISOString().slice(11, 16)}`,
            `Amount: ${r.details?.amount || 0}ml`,
            `Logical(8): ${logicalDate8.toISOString().slice(0, 10)}`
        );
    });

    // The critical record is 2026-02-01T04:00:00+08:00 = 2026-01-31T20:00:00Z
    // With dayStart=8, the SQL does: UTC + 8 hours - 8 hours = UTC
    // So 2026-01-31T20:00:00Z becomes 2026-01-31 (correct!)

    // But wait, the formula is:
    // TO_CHAR((r.time + 8h) - dayStartHour h, 'YYYY-MM-DD')
    // For 2026-01-31T20:00:00Z:
    // r.time + 8h = 2026-02-01T04:00:00Z
    // - 8h = 2026-01-31T20:00:00Z => "2026-01-31" ✓

    // Hmm, the logic seems correct. Let me check if the service is actually passing the right dayStartHour.

    console.log('\n--- Expected Calculation ---');
    console.log('Record at 2026-02-01 04:00 +08 = 2026-01-31 20:00 UTC');
    console.log('SQL: (UTC + 8h) - 8h = UTC => "2026-01-31" (should be counted in Jan 31)');
    console.log('But test shows it\'s still in Feb 1...');
    console.log('\nPossible issue: Service might not be passing dayStartHour correctly.');
}

run().catch(console.error);
