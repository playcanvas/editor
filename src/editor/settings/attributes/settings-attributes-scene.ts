editor.once('load', () => {
    editor.method('editorSettings:panel:unfold', (panel) => {
        const element = editor.call('layout.attributes').dom.querySelector(`.ui-panel.component.foldable.${panel}`);
        if (element && element.ui) {
            element.ui.folded = false;
        }
    });

    editor.on('attributes:inspect[editorSettings]', () => {
        editor.call('attributes:header', 'Settings');
    });
});
