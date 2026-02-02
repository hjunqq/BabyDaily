// Final debug - verify settings match and trace the issue

async function run() {
    const API_URL = 'http://localhost:3000';

    // 1. Login
    console.log('=== STEP 1: Login ===');
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('User ID from token:', loginData.user?.id);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Get and verify settings
    console.log('\n=== STEP 2: Verify Settings ===');
    const settingsRes = await fetch(`${API_URL}/settings`, { headers });
    const settings = await settingsRes.json();
    console.log('Settings returned by API:', settings);
    console.log('dayStartHour value:', settings.dayStartHour, '(type:', typeof settings.dayStartHour, ')');

    if (settings.dayStartHour !== 8) {
        console.log('WARNING: dayStartHour is not 8! Setting it now...');
        await fetch(`${API_URL}/settings`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ dayStartHour: 8 })
        });
    }

    // 3. Get baby
    const familiesRes = await fetch(`${API_URL}/families/my`, { headers });
    const families = await familiesRes.json();
    const babiesRes = await fetch(`${API_URL}/babies/family/${families[0]?.id}`, { headers });
    const babies = await babiesRes.json();
    const babyId = babies[0]?.id;

    // 4. Fetch trend
    console.log('\n=== STEP 3: Fetch Trend (check backend console for debug output) ===');
    const trendRes = await fetch(`${API_URL}/records/baby/${babyId}/trend?days=10`, { headers });
    const trendData = await trendRes.json();

    console.log('\nAPI Response:');
    console.table(trendData);

    // 5. Verify specific dates
    console.log('\n=== STEP 4: Verification ===');
    const apiByDate = {};
    trendData.forEach(d => { apiByDate[d.date] = d.milkMl; });

    // With dayStart=8, Feb 1 should be 600, not 760
    const feb1 = apiByDate['2026-02-01'] || 0;
    if (feb1 === 600) {
        console.log('✓ Feb 1 milk is 600ml - dayStartHour=8 is working correctly!');
    } else if (feb1 === 760) {
        console.log('✗ Feb 1 milk is 760ml - dayStartHour is NOT being applied (still using dayStart=0)');
        console.log('Possible causes:');
        console.log('1. Backend server not reloaded with latest code');
        console.log('2. Wrong userId being used to fetch settings');
        console.log('3. Settings not actually saved with dayStartHour=8');
    } else {
        console.log(`? Feb 1 milk is ${feb1}ml - unexpected value`);
    }
}

run().catch(console.error);
