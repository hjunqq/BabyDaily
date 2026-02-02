
const API_URL = 'http://localhost:3000';

async function main() {
    console.log('Starting seed data...');

    // 1. Login
    console.log('Logging in as dev...');
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const { access_token, user } = await loginRes.json();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
    };

    // 2. Get Baby
    console.log('Fetching baby...');
    const babiesRes = await fetch(`${API_URL}/families/my`, { headers });
    let babies = [];
    if (babiesRes.ok) {
        const families = await babiesRes.json();
        if (families.length > 0) {
            const familyId = families[0].id;
            const bRes = await fetch(`${API_URL}/babies/family/${familyId}`, { headers });
            babies = await bRes.json();
        }
    }

    let babyId;
    if (babies.length > 0) {
        babyId = babies[0].id;
    } else {
        // Init baby if needed (reusing logic from frontend roughly or assuming it exists)
        // Since this is a test script, we assume a baby exists or was created by the user already.
        // If not, we might fail. But user likely has one.
        console.error('No baby found. Please create a baby first via the app.');
        return;
    }
    console.log(`Using baby ID: ${babyId}`);

    // 3. Generate Data
    const now = new Date();
    const records = [];

    for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split('T')[0];
        console.log(`Generating data for ${dayStr}...`);

        // Feeds (5-7 times)
        const feedCount = 5 + Math.floor(Math.random() * 3);
        const startHour = 6;
        for (let j = 0; j < feedCount; j++) {
            const hour = startHour + Math.floor((16 / feedCount) * j) + Math.random();
            const time = new Date(date);
            time.setHours(Math.floor(hour), Math.floor((hour % 1) * 60), 0, 0);

            // Milk or Solid
            // 1-2 solids a day
            const isSolid = j === 2 || j === 4;

            if (isSolid && Math.random() > 0.3) {
                records.push({
                    type: 'FEED',
                    time: time.toISOString(),
                    details: {
                        subtype: 'SOLID',
                        amount: 30 + Math.floor(Math.random() * 50), // 30-80g
                        unit: 'g',
                        food: 'Rice Cereal'
                    }
                });
            } else {
                records.push({
                    type: 'FEED',
                    time: time.toISOString(),
                    details: {
                        subtype: 'BOTTLE',
                        amount: 120 + Math.floor(Math.random() * 9) * 10, // 120-200ml
                        unit: 'ml'
                    }
                });
            }
        }

        // Sleep
        records.push({
            type: 'SLEEP',
            time: new Date(dayStr + 'T10:00:00').toISOString(),
            endTime: new Date(dayStr + 'T11:30:00').toISOString(),
        });
        records.push({
            type: 'SLEEP',
            time: new Date(dayStr + 'T14:30:00').toISOString(),
            endTime: new Date(dayStr + 'T16:00:00').toISOString(),
        });

        // Diaper
        for (let k = 0; k < 5; k++) {
            const dTime = new Date(date);
            dTime.setHours(8 + k * 3, Math.floor(Math.random() * 60));
            records.push({
                type: 'DIAPER',
                time: dTime.toISOString(),
                details: { type: Math.random() > 0.7 ? 'POO' : 'PEE' }
            });
        }
    }

    // 4. Post Records (Batch would be better but simple loop works)
    console.log(`Posting ${records.length} records...`);
    let success = 0;

    // Use import endpoint for speed if available, or just create one by one
    // RecordController has importRecords endpoint: POST /records/baby/:babyId/import

    const importRes = await fetch(`${API_URL}/records/baby/${babyId}/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ records })
    });

    if (importRes.ok) {
        console.log('Successfully imported all records!');
    } else {
        console.log('Import failed, trying one by one...');
        // Fallback
        for (const rec of records) {
            await fetch(`${API_URL}/records`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...rec, babyId })
            });
            process.stdout.write('.');
        }
    }
    console.log('\nDone!');
}

main().catch(console.error);
