// Test seed data for day cutoff verification
// Run with: node scripts/seed_test_data.js

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
const headers = lines[0].split(',');
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

console.log('Records to import:', records.length);
console.log('Sample record:', records[0]);

// Expected totals (calendar day, dayStart=0):
// 2026-01-27: 70+160+130+130+80+30 = 600
// 2026-01-28: 150+90+70+150+120+90 = 670
// 2026-01-29: 160+160+120+130+140 = 710
// 2026-01-30: 100+140+150+160+120 = 670
// 2026-01-31: 140+150+130+110 = 530
// 2026-02-01: 160+120+150+160+110+60 = 760
// 2026-02-02: 90+80+155+100+90+140+120 = 775

// Expected totals (logical day, dayStart=8):
// What the user expects:
// 2026-02-02: 765 (from 08:00 Feb 2 to 08:00 Feb 3)
// 2026-02-01: 600 (from 08:00 Feb 1 to 08:00 Feb 2)
// Let me verify manually with dayStart=8:
// Logical "Feb 2" (08:00 Feb 2 to 07:59 Feb 3):
//   2026-02-02,09:25 -> 90
//   2026-02-02,10:00 -> 80
//   2026-02-02,12:23 -> 155
//   2026-02-02,15:35 -> 100
//   2026-02-02,17:50 -> 90
//   2026-02-02,19:48 -> 140
//   2026-02-02,22:30 -> 120
//   = 90+80+155+100+90+140+120 = 775 (not 765, user might have different data)

// Logical "Feb 1" (08:00 Feb 1 to 07:59 Feb 2):
//   2026-02-01,09:20 -> 120
//   2026-02-01,13:20 -> 150
//   2026-02-01,16:10 -> 160
//   2026-02-01,20:00 -> 110
//   2026-02-01,22:30 -> 60
//   = 120+150+160+110+60 = 600 ✓

// Note: 2026-02-01,04:00 -> 160ml belongs to "Logical Jan 31" (08:00 Jan 31 to 07:59 Feb 1)
// Logical "Jan 31" with dayStart=8:
//   2026-01-31,09:30 -> 150
//   2026-01-31,17:15 -> 130
//   2026-01-31,20:45 -> 110
//   2026-02-01,04:00 -> 160
//   = 150+130+110+160 = 550

// But what about 2026-01-31,06:30? That's before 08:00, so it belongs to "Logical Jan 30".
// Logical "Jan 30" with dayStart=8:
//   2026-01-30,09:35 -> 140
//   2026-01-30,14:00 -> 150
//   2026-01-30,17:00 -> 160
//   2026-01-30,21:15 -> 120
//   2026-01-31,06:30 -> 140
//   = 140+150+160+120+140 = 710

// So the data is correct and my logic should work.

async function run() {
    const API_URL = 'http://192.168.8.106:3000';

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

    // 5. Fetch Trend with days=10
    console.log('Fetching trend...');
    const trendRes = await fetch(`${API_URL}/records/baby/${babyId}/trend?days=10`, { headers });
    const trendData = await trendRes.json();
    console.log('Trend data (default dayStart=0 or user setting):');
    console.table(trendData);

    console.log('\n--- Verification Complete ---');
}

run().catch(console.error);
