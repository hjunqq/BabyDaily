// Manual calculation to verify expected values

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

// Parse data
const lines = data.trim().split('\n');
const records = lines.slice(1).map(line => {
    const [date, time, type, amount] = line.split(',');
    // date and time are in China Time
    const chinaTimeStr = `${date}T${time}:00+08:00`;
    const utcTime = new Date(chinaTimeStr);
    return {
        chinaDate: date,
        chinaTime: time,
        utcIso: utcTime.toISOString(),
        amount: parseInt(amount)
    };
});

console.log('=== Sample Records ===');
records.slice(0, 5).forEach(r => {
    console.log(`China: ${r.chinaDate} ${r.chinaTime} | UTC: ${r.utcIso} | ${r.amount}ml`);
});

// Group by calendar date (China Time) - dayStartHour=0
const byCalendar = {};
records.forEach(r => {
    byCalendar[r.chinaDate] = (byCalendar[r.chinaDate] || 0) + r.amount;
});

console.log('\n=== Grouped by Calendar Date (China Time, dayStart=0) ===');
Object.entries(byCalendar).sort().forEach(([date, sum]) => {
    console.log(`${date}: ${sum}ml`);
});

// Group by logical date (dayStartHour=8)
// Records before 08:00 China Time belong to previous day
const byLogical8 = {};
records.forEach(r => {
    const hour = parseInt(r.chinaTime.split(':')[0]);
    let logicalDate = r.chinaDate;
    if (hour < 8) {
        // Belongs to previous day
        const d = new Date(r.chinaDate + 'T00:00:00+08:00');
        d.setDate(d.getDate() - 1);
        logicalDate = d.toISOString().slice(0, 10);
    }
    byLogical8[logicalDate] = (byLogical8[logicalDate] || 0) + r.amount;
});

console.log('\n=== Grouped by Logical Date (dayStart=8, records before 8AM belong to prev day) ===');
Object.entries(byLogical8).sort().forEach(([date, sum]) => {
    console.log(`${date}: ${sum}ml`);
});

// Group by UTC date (what SQL does with (UTC + 8h - 8h) = UTC)
const byUtc = {};
records.forEach(r => {
    const utcDate = r.utcIso.slice(0, 10);
    byUtc[utcDate] = (byUtc[utcDate] || 0) + r.amount;
});

console.log('\n=== Grouped by UTC Date (what SQL formula (UTC+8-8) does) ===');
Object.entries(byUtc).sort().forEach(([date, sum]) => {
    console.log(`${date}: ${sum}ml`);
});

// Compare
console.log('\n=== Key Insight ===');
console.log('With dayStart=8, the correct Feb 1 value should be:', byLogical8['2026-02-01'], 'ml');
console.log('With UTC grouping (wrong), Feb 1 value would be:', byUtc['2026-02-01'], 'ml');
console.log('With calendar (dayStart=0), Feb 1 value is:', byCalendar['2026-02-01'], 'ml');
