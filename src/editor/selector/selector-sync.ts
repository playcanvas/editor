editor.once('load', () => {
    let lastSelectionType = null;
    let lastIds = [];
    const selection = { };
    let timeout;
    let lastCheck = 0;


    const checkSelector = function () {
        timeout = null;
        lastCheck = Date.now();

        const type = editor.call('selector:type');
        const items = editor.call('selector:items');

        let selectionType = editor.call('selector:type');
        const ids = [];

        if (type === 'entity') {
            for (let i = 0; i < items.length; i++) {
                ids.push(items[i].get('resource_id'));
            }
        } else if (type === 'asset') {
            for (let i = 0; i < items.length; i++) {
                const id = items[i].get('id');
                if (items[i].get('type') === 'script' && !id) {
                    ids.push(items[i].get('filename'));
                } else {
                    ids.push(id);
                }
            }
        } else if (type === 'editorSettings') {
            // editor settings always single
        } else {
            selectionType = null;
        }

        let changed = false;
        if (lastSelectionType !== selectionType) {
            changed = true;
        }

        if (!changed) {
            if (ids.length !== lastIds.length) {
                changed = true;
            } else {
                for (let i = 0; i < ids.length; i++) {
                    if (ids[i] !== lastIds[i]) {
                        changed = true;
                        break;
                    }
                }
            }
        }

        lastSelectionType = selectionType;
        lastIds = ids;

        if (changed) {
            editor.call('realtime:send', 'selection', {
                t: selectionType,
                ids: ids
            });
        }
    };

    editor.on('selector:change', (type, items) => {
        if (timeout) {
            return;
        }

        if ((Date.now() - lastCheck) > 500) {
            checkSelector();
        } else {
            timeout = setTimeout(checkSelector, 500);
        }
    });

    editor.on('selector:sync:raw', (data) => {
        data = JSON.parse(data);
        const id = data.u;

        // select
        selection[id] = {
            type: data.t,
            ids: data.ids
        };

        editor.emit(`selector:sync[${id}]`, selection[id]);
        editor.emit('selector:sync', id, selection[id]);
    });
});
