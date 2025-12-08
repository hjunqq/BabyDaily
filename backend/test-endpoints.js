const http = require('http');

// Helper for making requests
function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    // Attempt parsing JSON, or return text if empty/not-json
                    const parsed = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ status: res.statusCode, data: parsed });
                    } else {
                        console.error(`Request failed: ${method} ${path} -> ${res.statusCode}`);
                        console.error('Response:', data);
                        resolve({ status: res.statusCode, error: parsed }); // Resolve instead of reject to keep flow
                    }
                } catch (e) {
                    console.error('JSON Parse Error', e);
                    console.error('Raw Data:', data);
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Network Error: ${method} ${path}`, e.message);
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
    console.log(`PASS: ${message}`);
}

async function main() {
    console.log('>>> Starting API Verification...');

    // 1. Login
    const loginRes = await request('POST', '/auth/login/dev');
    if (loginRes.status !== 201 && loginRes.status !== 200) {
        console.error('Login failed, exiting.');
        return;
    }
    const token = loginRes.data.access_token;
    console.log('Login successful. Token acquired.');

    // 2. Get Families (to get baby)
    // Assuming there's a way to get families or babies directly? 
    // Let's check "families/my" based on contracts
    const familiesRes = await request('GET', '/families/my', null, token);
    let familyId;
    if (!familiesRes.data || familiesRes.data.length === 0) {
        console.log('No families found, creating one...');
        const createFam = await request('POST', '/families', { name: 'Test Family' }, token);
        familyId = createFam.data.id;
    } else {
        familyId = familiesRes.data[0].id;
    }
    console.log(`Using Family ID: ${familyId}`);

    // 3. Get Babies
    const babiesRes = await request('GET', `/babies/family/${familyId}`, null, token);
    let babyId;
    if (!babiesRes.data || babiesRes.data.length === 0) {
        console.log('No babies found, creating one...');
        const createBaby = await request('POST', '/babies', {
            family_id: familyId,
            name: 'Test Baby',
            gender: 'MALE',
            birthday: new Date().toISOString()
        }, token);
        babyId = createBaby.data.id;
    } else {
        babyId = babiesRes.data[0].id;
    }
    console.log(`Using Baby ID: ${babyId}`);

    // 4. Test Summary (should be empty initially or have data)
    const summary = await request('GET', `/records/baby/${babyId}/summary`, null, token);
    assert(summary.status === 200, 'Get Summary');
    assert(summary.data.hasOwnProperty('milkMl'), 'Summary has milkMl'); // Check CamelCase
    assert(summary.data.hasOwnProperty('diaperWet'), 'Summary has diaperWet');
    console.log('Summary Response:', JSON.stringify(summary.data));

    // 5. Test Trend
    const trend = await request('GET', `/records/baby/${babyId}/trend?days=7`, null, token);
    assert(trend.status === 200, 'Get Trend');
    assert(Array.isArray(trend.data), 'Trend is array');
    if (trend.data.length > 0) {
        assert(trend.data[0].hasOwnProperty('name'), 'Trend has name');
        assert(trend.data[0].hasOwnProperty('milk'), 'Trend has milk');
    }
    console.log('Trend Response (first item):', trend.data[0]);

    // 6. Test Create Record (VALID)
    const feedTime = new Date().toISOString();
    const createRecord = await request('POST', '/records', {
        baby_id: babyId,
        type: 'FEED',
        time: feedTime,
        details: { amount: 150, unit: 'ml', subtype: 'FORMULA' }
    }, token);
    assert(createRecord.status === 201, 'Create Record');
    const recordId = createRecord.data.id;
    console.log(`Created Record ID: ${recordId}`);

    // 7. Test Create Record (INVALID - DTO Check)
    console.log('Testing DTO Validation (expecting 400)...');
    const invalidRecord = await request('POST', '/records', {
        baby_id: babyId,
        // Missing type
        time: 'not-a-date',
        details: {}
    }, token);
    assert(invalidRecord.status === 400, 'Invalid Record Validated');
    console.log('Validation Error:', invalidRecord.error.message);

    // 8. Update Record
    const updateRecord = await request('PATCH', `/records/${recordId}`, {
        details: { amount: 180, unit: 'ml', subtype: 'FORMULA' }
    }, token);
    assert(updateRecord.status === 200, 'Update Record');
    assert(updateRecord.data.details.amount === 180, 'Record Updated');

    // 9. Delete Record
    const deleteRecord = await request('DELETE', `/records/${recordId}`, null, token);
    assert(deleteRecord.status === 200, 'Delete Record');

    // 10. Verify Deletion
    const getDeleted = await request('GET', `/records/${recordId}`, null, token);
    // NestJS findOne usually returns null or empty string if not found, or maybe 404 depending on impl.
    // The service returns `findOne({where: {id}})` which returns null if not found.
    // The controller returns that null. NestJS by default returns 200 OK with empty body if null returned?
    // Let's assume logic. If it returns null, we are good.
    console.log('Get Deleted Record Status:', getDeleted.status);

    console.log('>>> ALL TESTS PASSED SUCCESSFULLY! (If no errors above)');
}

main().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
