// Seed test data to LOCAL dev database and test trend

const data = `date,time,type,amount,unit,subtype
2026-01-27,09:00,FEED,70,ml,BOTTLE
2026-01-27,11:00,FEED,160,ml,BOTTLE
2026-01-27,14:50,FEED,130,ml,BOTTLE
2026-01-27,18:10,FEED,130,ml,BOTTLE
2026-01-27,21:10,FEED,80,ml,BOTTLE
2026-01-27,21:45,FEED,30,ml,BOTTLE
2026-01-28,07:15,FEED,150,ml,BOTTLE
2026-01-28,12:10,FEED,90,ml,BOTTLE
2026-01-28,13:00,FEED,70,ml,BOTTLE
2026-01-28,16:05,FEED,150,ml,BOTTLE
2026-01-28,20:20,FEED,120,ml,BOTTLE
2026-01-28,23:10,FEED,90,ml,BOTTLE
2026-01-29,08:15,FEED,160,ml,BOTTLE
2026-01-29,11:25,FEED,160,ml,BOTTLE
2026-01-29,16:10,FEED,120,ml,BOTTLE
2026-01-29,19:23,FEED,130,ml,BOTTLE
2026-01-29,22:20,FEED,140,ml,BOTTLE
2026-01-30,07:20,FEED,100,ml,BOTTLE
2026-01-30,09:35,FEED,140,ml,BOTTLE
2026-01-30,14:00,FEED,150,ml,BOTTLE
2026-01-30,17:00,FEED,160,ml,BOTTLE
2026-01-30,21:15,FEED,120,ml,BOTTLE
2026-01-31,06:30,FEED,140,ml,BOTTLE
2026-01-31,09:30,FEED,150,ml,BOTTLE
2026-01-31,17:15,FEED,130,ml,BOTTLE
2026-01-31,20:45,FEED,110,ml,BOTTLE
2026-02-01,04:00,FEED,160,ml,BOTTLE
2026-02-01,09:20,FEED,120,ml,BOTTLE
2026-02-01,13:20,FEED,150,ml,BOTTLE
2026-02-01,16:10,FEED,160,ml,BOTTLE
2026-02-01,20:00,FEED,110,ml,BOTTLE
2026-02-01,22:30,FEED,60,ml,BOTTLE
2026-02-02,09:25,FEED,90,ml,BOTTLE
2026-02-02,10:00,FEED,80,ml,BOTTLE
2026-02-02,12:23,FEED,155,ml,BOTTLE
2026-02-02,15:35,FEED,100,ml,BOTTLE
2026-02-02,17:50,FEED,90,ml,BOTTLE
2026-02-02,19:48,FEED,140,ml,BOTTLE
2026-02-02,22:30,FEED,120,ml,BOTTLE`;

// Parse CSV
const lines = data.trim().split('\n');
const records = lines.slice(1).map(line => {
    const [date, time, type, amount, unit, subtype] = line.split(',');
    // Combine date and time, interpret as China Time (UTC+8)
    const dateTime = new Date(`${date}T${time}:00+08:00`);
    return {
        type,
        time: dateTime.toISOString(),
        details: {
            subtype,
            amount: parseInt(amount),
            unit
        }
    };
});

async function run() {
    const API_URL = 'http://localhost:3000';  // LOCAL dev server

    console.log('Testing against LOCAL dev server:', API_URL);
    console.log('Records to import:', records.length);

    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('Token:', token ? 'OK' : 'FAILED');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Get Family and Baby
    const familiesRes = await fetch(`${API_URL}/families/my`, { headers });
    const families = await familiesRes.json();
    const familyId = families[0]?.id;
    console.log('Family ID:', familyId);

    const babiesRes = await fetch(`${API_URL}/babies/family/${familyId}`, { headers });
    const babies = await babiesRes.json();
    const babyId = babies[0]?.id;
    console.log('Baby ID:', babyId);

    // 3. Delete all existing records
    console.log('Deleting existing records...');
    await fetch(`${API_URL}/records/baby/${babyId}/all`, { method: 'DELETE', headers });

    // 4. Import new records
    console.log('Importing records...');
    const importRes = await fetch(`${API_URL}/records/baby/${babyId}/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records })
    });
    const importResult = await importRes.json();
    console.log('Import result:', importResult);

    // 5. Update dayStartHour to 8
    console.log('\n--- Updating dayStartHour to 8 ---');
    await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ dayStartHour: 8 })
    });

    // 6. Fetch Trend with days=10
    console.log('\n--- Trend with dayStartHour=8 ---');
    const trendRes = await fetch(`${API_URL}/records/baby/${babyId}/trend?days=10`, { headers });
    const trendData = await trendRes.json();
    console.log('Trend data:');
    console.table(trendData);

    // Expected with dayStartHour=8:
    console.log('\n--- Expected Values (dayStart=8) ---');
    console.log('Feb 2 (logical): 90+80+155+100+90+140+120 = 775');
    console.log('Feb 1 (logical): 120+150+160+110+60 = 600');
    console.log('Jan 31 (logical, includes 4AM record): 150+130+110+160 = 550');
    console.log('Jan 30 (logical, includes 6:30 AM): 140+150+160+120+140 = 710');

    // Verify
    const feb2 = trendData.find(d => d.date === '2026-02-02');
    const feb1 = trendData.find(d => d.date === '2026-02-01');
    const jan31 = trendData.find(d => d.date === '2026-01-31');
    const jan30 = trendData.find(d => d.date === '2026-01-30');

    console.log('\n--- Verification ---');
    console.log(`Feb 2: Expected 775, Got ${feb2?.milkMl} => ${feb2?.milkMl === 775 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Feb 1: Expected 600, Got ${feb1?.milkMl} => ${feb1?.milkMl === 600 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Jan 31: Expected 550, Got ${jan31?.milkMl} => ${jan31?.milkMl === 550 ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`Jan 30: Expected 710, Got ${jan30?.milkMl} => ${jan30?.milkMl === 710 ? '✓ PASS' : '✗ FAIL'}`);
}

run().catch(console.error);
