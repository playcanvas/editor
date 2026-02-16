import { LocalStorage } from '@/editor-api';

editor.once('load', () => {
    const ls = new LocalStorage();

    // Returns editor api.LocalStorage instance
    editor.method('localStorage', () => {
        return ls;
    });

    // Get a key from the local storage
    editor.method('localStorage:get', (key) => {
        return ls.get(key);
    });

    // Set a key-value pair in localStorage
    editor.method('localStorage:set', (key, value) => {
        return ls.set(key, value);
    });

    // Remove a key from the local storage
    editor.method('localStorage:unset', (key) => {
        return ls.unset(key);
    });

    // Returns true if the key exists in the local storage
    editor.method('localStorage:has', (key) => {
        return ls.has(key);
    });
});
