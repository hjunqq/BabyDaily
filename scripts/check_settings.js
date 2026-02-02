// Test to verify the exact flow
async function run() {
    const API_URL = 'http://localhost:3000';

    // Login
    const loginRes = await fetch(`${API_URL}/auth/login/dev`, { method: 'POST' });
    const { access_token } = await loginRes.json();
    const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' };

    // Get settings
    const settingsRes = await fetch(`${API_URL}/settings`, { headers });
    const settings = await settingsRes.json();

    console.log('=== SETTINGS ANALYSIS ===');
    console.log('Full settings object:', settings);
    console.log('Type of dayStartHour:', typeof settings.dayStartHour);
    console.log('Value of dayStartHour:', settings.dayStartHour);
    console.log('Truthy check (settings.dayStartHour || 0):', settings.dayStartHour || 0);

    // The issue might be that dayStartHour is a string "8" instead of number 8
    // Or it might be that the property name is different (snake_case vs camelCase)
    console.log('\n=== ALL KEYS IN SETTINGS ===');
    Object.entries(settings).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)} (type: ${typeof value})`);
    });

    // Check if there's a snake_case version
    if (settings.day_start_hour !== undefined) {
        console.log('\n!!! FOUND snake_case: day_start_hour =', settings.day_start_hour);
    }
}

run().catch(console.error);
