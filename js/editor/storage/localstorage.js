editor.once('load', function () {
    const ls = new api.LocalStorage();

    // Returns editor api.LocalStorage instance
    editor.method('localStorage', function () {
        return ls;
    });

    // Get a key from the local storage
    editor.method('localStorage:get', function (key) {
        return ls.get(key);
    });

    // Set a key-value pair in localStorage
    editor.method('localStorage:set', function (key, value) {
        return ls.set(key, value);
    });

    // Returns true if the key exists in the local storage
    editor.method('localStorage:has', function (key) {
        return ls.has(key);
    });
});
