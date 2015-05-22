editor.once('load', function() {
    'use strict';

    var selectorHistory = true;
    var changing = false;

    var newType = editor.call('selector:type');
    var newItems = editor.call('selector:items');

    var onSelectorChange = function() {
        changing = false;

        var oldType = newType;
        var oldItems = newItems;

        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        newType = type;
        newItems = items;

        editor.call('history:add', {
            name: (items.length === 0) ? 'deselect' : ('select ' + type),
            undo: function() {
                selectorHistory = false;
                editor.call('selector:set', oldType, oldItems);
                editor.once('selector:change', function() {
                    selectorHistory = true;
                });
            },
            redo: function() {
                selectorHistory = false;
                editor.call('selector:set', type, items);
                editor.once('selector:change', function() {
                    selectorHistory = true;
                });
            }
        });
    };

    editor.on('selector:change', function(type, items) {
        if (! selectorHistory) {
            newType = type;
            newItems = items;
            return;
        }

        if (changing)
            return;

        changing = true;
        setTimeout(onSelectorChange, 0);
    });

    editor.method('selector:history', function (toggle) {
        if (toggle === undefined)
            return selectorHistory;

        selectorHistory = toggle;
    });
});
