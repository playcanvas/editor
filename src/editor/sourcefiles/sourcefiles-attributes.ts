editor.once('load', () => {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    /**
     * Legacy script attributes are no longer parsed: the script is not fetched or run, and the
     * callback gets no attributes, so existing attribute values are kept as they are
     */
    editor.method('sourcefiles:scan', (_url: string, success: (data: object) => void) => {
        console.warn('Legacy script attributes are no longer parsed');
        success({});
    });
});
