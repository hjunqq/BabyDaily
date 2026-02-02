// Minimal test to debug exact issue

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

    // Get all records to see what's actually stored
    const recordsRes = await fetch(`${API_URL}/records/baby/${babyId}?limit=50`, { headers });
    const records = await recordsRes.json();

    // Find the 04:00 record
    const fourAm = records.find(r => {
        const time = new Date(r.time);
        const chinaHour = new Date(time.getTime() + 8 * 60 * 60 * 1000).getUTCHours();
        const chinaDate = new Date(time.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
        return chinaHour === 4 && chinaDate === '2026-02-01';
    });

    if (fourAm) {
        console.log('Found the 04:00 AM Feb 1 record:');
        console.log('  Stored UTC time:', fourAm.time);
        console.log('  Amount:', fourAm.details?.amount, 'ml');

        // Simulate SQL formula
        const utc = new Date(fourAm.time);
        const plus8 = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
        const minus8 = new Date(plus8.getTime() - 8 * 60 * 60 * 1000);
        const dateLabel = minus8.toISOString().slice(0, 10);

        console.log('\nSQL formula simulation:');
        console.log('  UTC time:', utc.toISOString());
        console.log('  + 8 hours:', plus8.toISOString());
        console.log('  - 8 hours:', minus8.toISOString());
        console.log('  Date label:', dateLabel);
        console.log('\n  Expected: 2026-01-31 (if dayStart=8 is working)');
        console.log('  Actual:', dateLabel);
        console.log('  Match:', dateLabel === '2026-01-31' ? '✓ YES' : '✗ NO');
    } else {
        console.log('Could not find the 04:00 AM Feb 1 record');
        console.log('\nAll records around that time:');
        records.filter(r => {
            const time = new Date(r.time);
            return time >= new Date('2026-01-31T18:00:00Z') && time <= new Date('2026-02-01T06:00:00Z');
        }).forEach(r => {
            const chinaTime = new Date(new Date(r.time).getTime() + 8 * 60 * 60 * 1000);
            console.log(`  UTC: ${r.time} | China: ${chinaTime.toISOString()} | ${r.details?.amount}ml`);
        });
    }
}

run().catch(console.error);
