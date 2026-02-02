// Test trend against LOCAL dev server with dayStartHour=8

async function run() {
    const API_URL = 'http://localhost:3000';  // LOCAL dev server

    // 1. Login
    console.log('Testing against LOCAL dev server:', API_URL);
    console.log('Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('Token:', token ? 'OK' : 'FAILED');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Get current settings
    console.log('\n--- Current Settings ---');
    const settingsRes = await fetch(`${API_URL}/settings`, { headers });
    const settings = await settingsRes.json();
    console.log('Settings:', settings);

    // 3. Update dayStartHour to 8
    console.log('\n--- Updating dayStartHour to 8 ---');
    const updateRes = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ dayStartHour: 8 })
    });
    const updated = await updateRes.json();
    console.log('Updated settings:', updated);

    // 4. Get Family and Baby
    const familiesRes = await fetch(`${API_URL}/families/my`, { headers });
    const families = await familiesRes.json();

    const babiesRes = await fetch(`${API_URL}/babies/family/${families[0]?.id}`, { headers });
    const babies = await babiesRes.json();
    const realBabyId = babies[0]?.id;

    // 5. Fetch trend with days=10 (should respect dayStartHour=8 now)
    console.log('\n--- Trend with dayStartHour=8 ---');
    const trendRes = await fetch(`${API_URL}/records/baby/${realBabyId}/trend?days=10`, { headers });
    const trendData = await trendRes.json();
    console.log('Trend data:');
    console.table(trendData);

    // Expected with dayStartHour=8:
    // Logical "Feb 2" (08:00 Feb 2 to 07:59 Feb 3): 90+80+155+100+90+140+120 = 775
    // Logical "Feb 1" (08:00 Feb 1 to 07:59 Feb 2): 120+150+160+110+60 = 600
    // Logical "Jan 31" (08:00 Jan 31 to 07:59 Feb 1): 150+130+110+160 = 550
    // Logical "Jan 30" (08:00 Jan 30 to 07:59 Jan 31): 140+150+160+120+140 = 710

    console.log('\n--- Expected Values (dayStart=8) ---');
    console.log('Feb 2 (logical): 90+80+155+100+90+140+120 = 775');
    console.log('Feb 1 (logical): 120+150+160+110+60 = 600');
    console.log('Jan 31 (logical): 150+130+110+160 = 550');
    console.log('Jan 30 (logical): 140+150+160+120+140 = 710');

    console.log('\n--- Verification Complete ---');
}

run().catch(console.error);
