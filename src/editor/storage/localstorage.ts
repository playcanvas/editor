import { LocalStorage } from '@/editor-api/localstorage';

editor.once('load', () => {
    const ls = new LocalStorage();

    // Returns editor api.LocalStorage instance
    editor.method('localStorage', () => {
        return ls;
    });

    // Get a key from the local storage
    editor.method('localStorage:get', (key: string) => {
        return ls.get(key);
    });

    // Set a key-value pair in localStorage
    // values are JSON-encoded, so flags and numbers store as well as objects and strings
    editor.method('localStorage:set', (key: string, value: unknown) => {
        return ls.set(key, value as object | string);
    });

    // Remove a key from the local storage
    editor.method('localStorage:unset', (key: string) => {
        return ls.unset(key);
    });

    // Returns true if the key exists in the local storage
    editor.method('localStorage:has', (key: string) => {
        return ls.has(key);
    });
});
