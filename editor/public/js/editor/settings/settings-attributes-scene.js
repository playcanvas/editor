editor.once('load', function() {
    'use strict';

    editor.method('editorSettings:panel:unfold', function(panel) {
        var element = editor.call('layout.right').innerElement.querySelector('.ui-panel.component.foldable.' + panel);
        if (element && element.ui) {
            element.ui.folded = false;
        }
    });

    editor.on('attributes:inspect[editorSettings]', function() {
        editor.call('attributes:header', 'Settings');
    });
});
