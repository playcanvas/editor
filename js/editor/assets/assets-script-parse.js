editor.once('load', function () {
    if (editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    editor.method('scripts:parse', function (asset, fn) {
        editor.call('scripts:handleParse', asset, true, fn);
    });
});
