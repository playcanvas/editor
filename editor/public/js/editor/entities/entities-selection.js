
editor.once('load', function() {
    'use strict';

    // returns all selected entities
    editor.method('entities:selection', function () {
        var selection = editor.call('selector:items');
        if (selection) {
            return selection.filter(function (s) {
                return s.components;
            });
        }

        return [];
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


