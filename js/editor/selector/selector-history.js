editor.once('load', function () {
    var selectorHistory = true;
    var changing = false;

    var newType = editor.call('selector:type');
    var newItems = editor.call('selector:items');

    var onSelectorChange = function () {
        changing = false;

        var oldType = newType;
        var oldItems = newItems;

        var type = editor.call('selector:type');
        var items = editor.call('selector:items');

        newType = type;
        newItems = items;

        editor.call('history:add', {
            name: (items.length === 0) ? 'deselect' : ('select ' + type),
            select: true,
            undo: function () {
                var prev = selectorHistory;
                selectorHistory = false;
                editor.call('selector:set', oldType, oldItems);
                editor.once('selector:change', function () {
                    selectorHistory = prev;
                });
            },
            redo: function () {
                var prev = selectorHistory;
                selectorHistory = false;
                editor.call('selector:set', type, items);
                editor.once('selector:change', function () {
                    selectorHistory = prev;
                });
            }
        });
    };

    editor.on('selector:change', function (type, items) {
        if (type === 'entity' || type === 'asset') return;

        if (!selectorHistory) {
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
        editor.selection.history.enabled = toggle;
    });
});
