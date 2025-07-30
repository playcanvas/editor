editor.once('load', () => {
    if (editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    editor.method('scripts:parse', (asset, fn) => {
        editor.call('scripts:handleParse', asset, true, fn);
    });
});
