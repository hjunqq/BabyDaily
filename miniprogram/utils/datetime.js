// All display/parsing uses Beijing time (UTC+8) so the miniprogram shows
// consistent times regardless of the device's system timezone.
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad2(value) {
    return String(value).padStart(2, '0');
}

function parseApiDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

// Returns a Date whose UTC getters reflect Beijing local fields.
function toBeijing(date) {
    return new Date(date.getTime() + BEIJING_OFFSET_MS);
}

function formatLocalTime(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    const b = toBeijing(date);
    return `${pad2(b.getUTCHours())}:${pad2(b.getUTCMinutes())}`;
}

function formatLocalDateKey(value) {
    const date = parseApiDate(value) || new Date();
    const b = toBeijing(date);
    return `${b.getUTCFullYear()}-${pad2(b.getUTCMonth() + 1)}-${pad2(b.getUTCDate())}`;
}

function formatMonthDay(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    const b = toBeijing(date);
    return `${b.getUTCMonth() + 1}月${b.getUTCDate()}日`;
}

function getLogicalDateKey(value, dayStartHour) {
    const date = parseApiDate(value) || new Date();
    const hour = Number.isFinite(dayStartHour) ? Number(dayStartHour) : 0;
    const shifted = new Date(date.getTime() - hour * 60 * 60 * 1000);
    return formatLocalDateKey(shifted);
}

function formatLocalDateTime(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    const b = toBeijing(date);
    return `${b.getUTCFullYear()}/${b.getUTCMonth() + 1}/${b.getUTCDate()} ${formatLocalTime(date)}`;
}

function formatEditableDateTime(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    const b = toBeijing(date);
    return `${b.getUTCFullYear()}-${pad2(b.getUTCMonth() + 1)}-${pad2(b.getUTCDate())} ${formatLocalTime(date)}`;
}

function parseEditableDateTime(value) {
    if (!value) return null;
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
    if (!match) return null;

    const [, year, month, day, hour, minute] = match;
    // Interpret the input as Beijing local time, build a real UTC Date.
    const utcMs = Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        0,
        0,
    ) - BEIJING_OFFSET_MS;
    const date = new Date(utcMs);

    return Number.isNaN(date.getTime()) ? null : date;
}

function toApiISOString(value) {
    const date = value ? parseEditableDateTime(value) : new Date();
    return (date || new Date()).toISOString();
}

function isSameLocalDay(left, right) {
    return formatLocalDateKey(left) === formatLocalDateKey(right);
}

module.exports = {
    formatEditableDateTime,
    formatLocalDateKey,
    formatLocalDateTime,
    formatLocalTime,
    formatMonthDay,
    getLogicalDateKey,
    isSameLocalDay,
    parseApiDate,
    toApiISOString,
};
