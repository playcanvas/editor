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


    // var lastSelected = null;
    //
    // editor.on('selector:add', function(type, obj) {
    //     if (type === 'entity') {
    //         lastSelected = obj;
    //     } else {
    //         lastSelected = null;
    //     }
    // });
    //
    // editor.on('selector:remove', function(t, obj) {
    //     var type = editor.call('selector:type');
    //     var items = editor.call('selector:items');
    //
    //     if (type === 'entity') {
    //         lastSelected = items[items.length - 1];
    //     } else {
    //         lastSelected = null;
    //     }
    // });
    //
    // editor.on('selector:set', function(type) {
    //     if (type !== 'entity')
    //         lastSelected = null;
    // });
});
