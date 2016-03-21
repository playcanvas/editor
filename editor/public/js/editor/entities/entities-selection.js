editor.once('load', function() {
    'use strict';

    // returns all selected entities
    editor.method('entities:selection', function () {
        if (editor.call('selector:type') !== 'entity')
            return [ ];

        return editor.call('selector:items').slice(0);
    });

    // returns first selected entity
    editor.method('entities:selectedFirst', function () {
        var selection = editor.call('entities:selection');
        if (selection.length) {
            return selection[0];
        } else {
            return null;
        }
    });
});
