import { Events, Observer } from '@playcanvas/observer';

/**
 * Performs deep copy
 * @param data - The object to copy
 * @returns The copied object
 */
export const deepCopy = <T>(data: T): T => {
    if (data == null || typeof (data) !== 'object') {
        return data;
    }

    if (data instanceof Array) {
        const arr: any[] = [];
        for (let i = 0; i < data.length; i++) {
            arr[i] = deepCopy(data[i]);
        }
        return arr as T;
    }
    const obj: any = { };
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            obj[key] = deepCopy(data[key]);
        }
    }
    return obj as T;
};

/**
 * Performs deep equal comparison
 * @param a - The first item to compare
 * @param b - The second item to compare
 * @returns Whether the objects are equal
 */
export const deepEqual = (a: any, b: any): boolean => {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (typeof a !== 'object' || typeof b !== 'object') {
        return false;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
        return false;
    }
    for (let i = 0; i < keysA.length; i++) {
        const key = keysA[i];
        if (!b.hasOwnProperty(key)) {
            return false;
        }
        if (!deepEqual(a[key], b[key])) {
            return false;
        }
    }
    return true;
};

/**
 * Natural sort comparison
 * @param a - The first string to compare
 * @param b - The second string to compare
 * @returns The comparison result
 */
export const naturalCompare = (a: string, b: string): number => {
    const regex = /(\d+|\D+)/g;
    const split = str => str.match(regex);

    const aParts = split(a) ?? [];
    const bParts = split(b) ?? [];

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        const aPart = aParts[i];
        const bPart = bParts[i];

        // If they are both numbers, compare them numerically
        if (/\d/.test(aPart) && /\d/.test(bPart)) {
            if (+aPart !== +bPart) {
                return +aPart - +bPart;
            }
        } else if (aPart !== bPart) {
            return aPart < bPart ? -1 : 1;
        }
    }

    return aParts.length - bParts.length;
};

/**
 * Sets a value at a path in an object
 * @param obj - The object to set the value in
 * @param path - The path to set the value at
 * @param value - The value to set
 * @returns Whether the value was set
 */
export const set = (obj: any, path: string, value: any): boolean => {
    const parts = path.split('.');
    let ref = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!ref.hasOwnProperty(parts[i])) {
            ref[parts[i]] = {};
        }
        ref = ref[parts[i]];
    }
    ref[parts[parts.length - 1]] = value;
    return true;
};

/**
 * Gets a value at a path in an object
 * @param obj - The object to get the value from
 * @param path - The path to get the value from
 * @returns The value at the path
 */
export const unset = (obj: any, path: string): boolean => {
    const parts = path.split('.');
    let ref = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        ref = ref[parts[i]];
        if (!ref) {
            return false;
        }
    }
    if (!ref) {
        return false;
    }
    delete ref[parts[parts.length - 1]];
    return true;
};

/**
 * Inserts a value at a path in an object
 * @param obj - The object to insert the value in
 * @param path - The path to insert the value at
 * @param value - The value to insert
 * @param index - The index to insert the value at
 * @returns Whether the value was inserted
 */
export const insert = (obj: any, path: string, value: any, index: number): boolean => {
    const parts = path.split('.');
    let ref = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        ref = ref[parts[i]];
        if (!ref) {
            return false;
        }
    }
    if (!ref) {
        return false;
    }
    const arr = ref[parts[parts.length - 1]];
    if (!Array.isArray(arr)) {
        return false;
    }
    arr.splice(index, 0, value);
    return true;
};

/**
 * Removes a value at a path in an object
 * @param obj - The object to remove the value from
 * @param path - The path to remove the value from
 * @param index - The index to remove the value from
 * @returns Whether the value was removed
 */
export const remove = (obj: any, path: string, index: number): boolean => {
    const parts = path.split('.');
    let ref = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        ref = ref[parts[i]];
        if (!ref) {
            return false;
        }
    }
    if (!ref) {
        return false;
    }
    const arr = ref[parts[parts.length - 1]];
    if (!Array.isArray(arr)) {
        return false;
    }
    arr.splice(index, 1);
    return true;
};

/**
 * Converts bytes to human readable string
 * @param bytes - The number of bytes
 * @returns The human readable string
 */
export const bytesToHuman = (bytes: number): string => {
    if (isNaN(bytes) || bytes === 0) {
        return '0 B';
    }
    const k = 1000;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toPrecision(3)} ${sizes[i]}`;
};

/**
 * Converts count to human readable string
 * @param count - The count
 * @returns The human readable string
 */
export const countToHuman = (count: number): string => {
    if (count < 1000) {
        return count.toString();
    }
    if (count < 1000000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return `${(count / 1000000).toFixed(1)}M`;
};

/**
 * Converts specified date string to a date in this format:
 * Wed, Jul 18, 2018, 12:55:00
 * @param date - The date string
 * @returns The converted date string
 */
export const convertDatetime = (date: string | Date): string => {
    const d = new Date(date);
    const dateString = d.toDateString();
    const dateParts = dateString.split(' ');
    const timeString = d.toTimeString();
    const space = timeString.indexOf(' ');
    return `${dateParts[0]}, ${dateParts[1]} ${dateParts[2]}, ${dateParts[3]}, ${timeString.substring(0, space)}`;
};

/**
 * @param t - The object to assign events
 */
export const assignEvents = (t: any): void => {
    Object.assign(t, new Events());
    t._events = {};
};

/**
 * @param url - The url to append query string to
 * @param params - The query object
 * @returns The url with query string appended
 */
export const buildQueryUrl = (url: string, params: Record<string, string | number | boolean>): string => {
    const adj = url.indexOf('?') === -1 ? '?' : '&';
    return `${url}${adj}${Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
};

/**
 * Create a new file from the source and download it.
 * @param filename - The filename
 * @param src - The source
 */
export const fileDownload = (filename: string, src: string): void => {
    const blob = new Blob([src], { type: 'text/plain' });
    const a = document.createElement('a');
    a.download = filename;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
};

/**
 * Creates a date string for use in filenames.
 * @returns The date string
 */
export const fileNameDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}`;
};

/**
 * Converts camel case to title case.
 * @param str - The string to convert
 * @returns The converted string
 */
export const camelCaseToTitle = (str: string): string => {
    return str.replace(/([0-9A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
};

/**
 * Converts a value to a clean string.
 * @param val - The value to convert
 * @param depth - The depth to convert
 * @returns The converted string
 */
export const toCleanStr = (val: any, depth: number = 0): string => {
    if (Array.isArray(val)) {
        if (depth > 1) {
            return '[array]';
        }
        return `(${val.map(v => toCleanStr(v, depth + 1)).join(', ')})`;
    }

    if (val === null || val === undefined) {
        return 'None';
    }

    if (typeof val === 'object') {
        return '[object]';
    }

    if (typeof val === 'number') {
        return val.toFixed(3);
    }

    if (typeof val === 'boolean') {
        return val ? 'True' : 'False';
    }

    return val;
};

/**
 * Formats objects for display and logging
 */
export const formatter = {
    /**
     * @param msg - The message to format
     * @returns The formatted message
     */
    parse: (msg: string): string[] => {
        const minText = msg.replace(/<<[^>]*>>/g, '');
        const text = msg.replace(/<<([^>]*)>>/g, '$1');
        return [minText, text];
    },

    /**
     * @param asset - The asset to format
     * @returns The formatted asset
     */
    asset: (asset: Observer): string => {
        return `${asset.get('name')}<< (${asset.get('id')})>>`;
    },

    /**
     * @param entity - The asset to format
     * @returns The formatted asset
     */
    entity: (entity: Observer): string => {
        return `${entity.get('name')}<< (${entity.get('resource_id')})>>`;
    },

    /**
     * @param path - The path to format
     * @returns The formatted path
     */
    path: (path: string): string => {
        const last = path.split('.').pop();
        return `${camelCaseToTitle(last)}<< (${path})>>`;
    },

    /**
     * @param val - The value to format
     * @returns The formatted value
     */
    value: (val: any): string => {
        return `${toCleanStr(val)}<< (${JSON.stringify(val)})>>`;
    },

    /**
     * @param name - The name to format
     * @param value - The value to format
     * @returns The formatted constant
     */
    const: (name: string, value: string): string => {
        return `${name}<< (${value})>>`;
    }
};

/**
 * Throttles a function to once per delay
 * @param fn - The function to throttle
 * @param delay - The delay to throttle by
 * @returns The throttled function
 */
export const throttler = (fn: Function, delay: number = 0): Function => {
    let timeout = null;
    return (...args) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            timeout = null;
            fn(...args);
        }, delay);
    };
};

/**
 * Limits a function to once per frame
 * @param fn - The function to limit
 * @returns The limited function
 */
export const frameLimiter = (fn: Function): Function => {
    let called = false;
    return (...args) => {
        if (called) {
            return;
        }
        called = true;
        requestAnimationFrame(() => {
            called = false;
            fn(...args);
        });
    };
};

/**
 * Creates a spinner element
 * @param size - The size of the spinner
 * @param className - The class name of the spinner
 * @returns The spinner element
 */
export const createSpinner = (size: number, className: string = 'spin'): SVGElement => {
    const spinner = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spinner.classList.add(className);
    spinner.setAttribute('width', `${size}`);
    spinner.setAttribute('height', `${size}`);
    spinner.setAttribute('x', '0');
    spinner.setAttribute('y', '0');
    spinner.setAttribute('viewBox', '0 0 64 64');
    spinner.innerHTML = '<g width="65" height="65"><path fill="#773417" d="M32,60 C47.463973,60 60,47.463973 60,32 C60,16.536027 47.463973,4 32,4 C16.536027,4 4,16.536027 4,32 C4,47.463973 16.536027,60 32,60 Z M32,64 C14.326888,64 0,49.673112 0,32 C0,14.326888 14.326888,0 32,0 C49.673112,0 64,14.326888 64,32 C64,49.673112 49.673112,64 32,64 Z"></path><path class="spin" fill="#FF6600" d="M62.3041668,42.3124142 C58.1809687,54.9535127 46.0037894,64 32,64 L32,60.0514995 C44.0345452,60.0514995 54.8533306,51.9951081 58.5660922,41.0051114 L62.3041668,42.3124142 Z"></path></g>';
    return spinner;
};

/**
 * Handles AJAX result in single callback
 * @param ajax - The AJAX object
 * @param callback - The callback function
 * @returns The AJAX object
 */
export const handleCallback = <T extends { on: (event: string, handler: (status: any, data: any) => void) => any }>(
    ajax: T,
    callback: (err?: string, data?: any) => void
): T => {
    ajax.on('load', (status, data) => callback(null, data));
    ajax.on('error', (status, err) => callback(err));
    return ajax;
};


/**
 * @param path - The path to check in the engine.
 * @returns Whether the engine has the property.
 */
export const validateEnginePath = (path: string) => {
    const parts = path.split('.');
    let obj = pc;
    for (let i = 0; i < parts.length; i++) {
        if (!obj.hasOwnProperty(parts[i]) && obj[parts[i]] === undefined) {
            return false;
        }
        obj = obj[parts[i]];
    }
    return true;
};
