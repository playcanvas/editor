editor.once('load', function () {
    var CLIPBOARD_NAME = 'playcanvas_editor_clipboard';
    var CLIPBOARD_META = CLIPBOARD_NAME + '_meta';

    // get current clipboard value
    editor.method('entities:clipboard:get', function () {
        return editor.call('localStorage:get', CLIPBOARD_NAME);
    });

    // set current clipboard value
    editor.method('entities:clipboard:set', function (data) {
        editor.call('localStorage:set', CLIPBOARD_META, {project: config.project.id});
        editor.call('localStorage:set', CLIPBOARD_NAME, data);
    });

    // return true if there is no data in the clipboard
    editor.method('entities:clipboard:empty', function () {
        return !editor.call('localStorage:get', CLIPBOARD_META);
    });
});