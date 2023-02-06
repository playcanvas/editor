editor.once('load', function () {
    editor.method('scripts:parse', function (asset, fn) {
        editor.call('scripts:handleParse', asset, false, fn);
    });
});
