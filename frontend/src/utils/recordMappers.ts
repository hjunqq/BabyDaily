import type { BabyRecord } from '../types';

/**
 * Maps record type to Chinese display name
 */
export const mapRecordType = (type: BabyRecord['type']): string => {
    switch (type) {
        case 'FEED':
            return '喂奶';
        case 'DIAPER':
            return '尿布';
        case 'SLEEP':
            return '睡眠';
        case 'BATH':
            return '洗澡';
        case 'HEALTH':
            return '健康';
        case 'GROWTH':
            return '成长';
        case 'MILESTONE':
            return '里程碑';
        case 'VITA_AD':
            return '维生素 AD';
        case 'VITA_D3':
            return '维生素 D3';
        default:
            return '记录';
    }
};

/**
 * Maps record to detail display string
 */
export const mapRecordDetail = (record: BabyRecord): string => {
    let main = '-';

    if (record.type === 'FEED') {
        const details: any = record.details || {};
        const amount = details.amount ? `${details.amount}${details.unit || 'ml'}` : '';
        main = amount;
    } else if (record.type === 'DIAPER') {
        const t = (record.details as any)?.type;
        if (t === 'BOTH') main = '尿 + 便';
        else if (t === 'POO') main = '便便';
        else main = '尿尿';
    } else if (record.type === 'SLEEP') {
        main = '睡眠';
    } else if (record.type === 'VITA_AD' || record.type === 'VITA_D3') {
        const details: any = record.details || {};
        const amount = details.amount ? `${details.amount}${details.unit || '粒'}` : '1粒';
        main = amount;
    }

    // If there's no specific detail, use remark as main
    if (main === '-' || !main) {
        return record.remark || '-';
    }

    // If there is detail AND remark, combine them
    if (record.remark) {
        return `${main} (${record.remark})`;
    }

    return main;
};
