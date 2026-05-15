function pad2(value) {
    return String(value).padStart(2, '0');
}

function parseApiDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalTime(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatLocalDateKey(value) {
    const date = parseApiDate(value) || new Date();
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatMonthDay(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
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
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${formatLocalTime(date)}`;
}

function formatEditableDateTime(value) {
    const date = parseApiDate(value);
    if (!date) return '';
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${formatLocalTime(date)}`;
}

function parseEditableDateTime(value) {
    if (!value) return null;
    const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
    if (!match) return null;

    const [, year, month, day, hour, minute] = match;
    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        0,
        0,
    );

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
