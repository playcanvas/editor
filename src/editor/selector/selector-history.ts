editor.once('load', () => {
    let selectorHistory = true;
    let changing = false;

    let newType = editor.call('selector:type');
    let newItems = editor.call('selector:items');

    const onSelectorChange = function () {
        changing = false;

        const oldType = newType;
        const oldItems = newItems;

        const type = editor.call('selector:type');
        const items = editor.call('selector:items');

        newType = type;
        newItems = items;

        editor.api.globals.history.add({
            name: (items.length === 0) ? 'deselect' : (`select ${type}`),
            combine: false,
            select: true,
            undo: function () {
                const prev = selectorHistory;
                selectorHistory = false;
                editor.call('selector:set', oldType, oldItems);
                editor.once('selector:change', () => {
                    selectorHistory = prev;
                });
            },
            redo: function () {
                const prev = selectorHistory;
                selectorHistory = false;
                editor.call('selector:set', type, items);
                editor.once('selector:change', () => {
                    selectorHistory = prev;
                });
            }
        });
    };

    editor.on('selector:change', (type, items) => {
        if (type === 'entity' || type === 'asset') {
            return;
        }

        if (!selectorHistory) {
            newType = type;
            newItems = items;
            return;
        }

        if (changing) {
            return;
        }

        changing = true;
        setTimeout(onSelectorChange, 0);
    });

    editor.method('selector:history', (toggle) => {
        if (toggle === undefined) {
            return selectorHistory;
        }

        selectorHistory = toggle;
        editor.api.globals.selection.history.enabled = toggle;
    });
});
