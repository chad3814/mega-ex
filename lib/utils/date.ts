
interface SerialDate {
    __type: 'Date';
    value: number;
}

export interface DateContainer {
    [key: string]: Date | string | number | boolean | null | DateContainer | undefined | DateContainer[] | SerialDate;
}

export function dateToNumber(obj: DateContainer): DateContainer {
    if (Array.isArray(obj)) {
        throw new Error('top-level array not supported');
    }
    const result: DateContainer = {};
    for (const key in obj) {
        const value = obj[key];
        if (value instanceof Date) {
            result[key] = { __type: 'Date', value: value.getTime() };
        } else if (Array.isArray(value)) {
            result[key] = value.map((item) => dateToNumber(item));
        } else if (typeof value === 'object' && value !== null) {
            result[key] = dateToNumber(value as DateContainer);
        } else {
            result[key] = value;
        }
    }
    return result;
}

export function numberToDate(obj: DateContainer): DateContainer {
    if (Array.isArray(obj)) {
        throw new Error('top-level array not supported');
    }
    const result: DateContainer = {};
    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null && '__type' in value && (value as SerialDate).__type === 'Date') {
            result[key] = new Date((value as SerialDate).value);
        } else if (Array.isArray(value)) {
            result[key] = value.map((item) => numberToDate(item));
        } else if (typeof value === 'object' && value !== null) {
            result[key] = numberToDate(value as DateContainer);
        } else {
            result[key] = value;
        }
    }
    return result;
}
