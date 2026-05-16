// Shared record presentation: icon, color class, type label, and value summary.
// Keep all pages (home / records / record-detail) consistent.

function recordIcon(type, subtype) {
    if (type === 'FEED') {
        if (subtype === 'BREAST') return '🤱';
        if (subtype === 'SOLID') return '🥣';
        return '🍼';
    }
    if (type === 'DIAPER') return '🧷';
    if (type === 'BATH') return '🛁';
    if (type === 'SLEEP') return '💤';
    if (type === 'VITA_AD') return '💊';
    if (type === 'VITA_D3') return '☀️';
    if (type === 'TOPICAL') return '🧴';
    if (type === 'SOLIDS') return '🥣';
    return '📝';
}

function recordIconClass(type) {
    if (type === 'FEED') return 'feed';
    if (type === 'DIAPER') return 'diaper';
    if (type === 'BATH') return 'bath';
    if (type === 'SLEEP') return 'sleep';
    if (type === 'VITA_AD' || type === 'VITA_D3') return 'supplement';
    if (type === 'TOPICAL') return 'supplement';
    if (type === 'SOLIDS') return 'feed';
    return 'feed';
}

function recordTypeLabel(type, subtype) {
    if (type === 'FEED') {
        if (subtype === 'BREAST') return '亲喂';
        if (subtype === 'SOLID') return '辅食';
        return '瓶喂';
    }
    if (type === 'DIAPER') return '换尿布';
    if (type === 'BATH') return '洗澡';
    if (type === 'SLEEP') return '睡眠';
    if (type === 'VITA_AD') return '维生素 AD';
    if (type === 'VITA_D3') return '维生素 D3';
    if (type === 'TOPICAL') return '涂药膏';
    if (type === 'SOLIDS') return '辅食';
    return '记录';
}

function formatDuration(mins) {
    const v = Number(mins) || 0;
    if (v < 60) return v + ' 分钟';
    const h = Math.floor(v / 60);
    const m = v % 60;
    return m > 0 ? h + ' 小时 ' + m + ' 分钟' : h + ' 小时';
}

function recordValue(record) {
    const d = (record && record.details) || {};
    const type = record && record.type;

    if (type === 'FEED') {
        if (d.subtype === 'BREAST') return (d.duration || 0) + ' 分钟';
        return d.amount ? d.amount + ' ml' : '';
    }
    if (type === 'DIAPER') {
        if (d.type === 'BOTH') return '尿 + 便';
        if (d.type === 'POO') return '便便';
        return '尿尿';
    }
    if (type === 'SLEEP') return formatDuration(d.duration);
    if (type === 'BATH') return d.duration ? d.duration + ' 分钟' : '';
    if (type === 'VITA_AD' || type === 'VITA_D3') return '已服用';
    if (type === 'SOLIDS') {
        const food = d.food || '辅食';
        if (d.amount) return food + ' ' + d.amount + (d.unit || 'g');
        return food;
    }
    if (type === 'TOPICAL') {
        const product = d.product || '药膏';
        return d.area ? product + ' · ' + d.area : product;
    }
    return '';
}

module.exports = {
    recordIcon,
    recordIconClass,
    recordTypeLabel,
    recordValue,
    formatDuration,
};
