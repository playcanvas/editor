editor.once('load', () => {
    const isMac = navigator.userAgent.indexOf('Mac OS X') !== -1;

    editor.method('editor:mac', () => {
        return isMac;
    });
});
