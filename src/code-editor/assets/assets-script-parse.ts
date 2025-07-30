editor.once('load', () => {
    editor.method('scripts:parse', (asset, fn) => {
        editor.call('scripts:handleParse', asset, false, fn);
    });
});
