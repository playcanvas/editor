editor.once('load', () => {
    editor.method('editorSettings:panel:foldAll', () => {
        editor.call('layout.attributes').dom.querySelectorAll('.pcui-panel.settings-panel').forEach((el) => {
            if (el.ui) {
                el.ui.collapsed = true;
            }
        });
    });

    editor.method('editorSettings:panel:unfold', (panel) => {
        const element = editor.call('layout.attributes').dom.querySelector(`.pcui-panel.settings-panel.${panel}`);
        if (element?.ui) {
            element.ui.collapsed = false;
        }
    });

    editor.on('attributes:inspect[editorSettings]', () => {
        editor.call('attributes:header', 'Settings');
    });
});
