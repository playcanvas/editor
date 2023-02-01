editor.once('load', function () {
    const clipboard = editor.clipboard;

    // get current clipboard instance
    editor.method('clipboard', function () {
        return clipboard;
    });

    // get current clipboard value
    editor.method('clipboard:get', function () {
        return clipboard.value;
    });

    // set current clipboard value
    editor.method('clipboard:set', function (data) {
        clipboard.value = data;
    });

    // return true if there is no data in the clipboard
    editor.method('clipboard:empty', function () {
        return !clipboard.value;
    });
});
