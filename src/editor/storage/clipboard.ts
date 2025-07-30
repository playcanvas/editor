editor.once('load', () => {
    const clipboard = editor.api.globals.clipboard;

    // get current clipboard instance
    editor.method('clipboard', () => {
        return clipboard;
    });

    // get current clipboard value
    editor.method('clipboard:get', () => {
        return clipboard.value;
    });

    // set current clipboard value
    editor.method('clipboard:set', (data) => {
        clipboard.value = data;
    });

    // return true if there is no data in the clipboard
    editor.method('clipboard:empty', () => {
        return !clipboard.value;
    });
});
