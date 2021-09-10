editor.once('load', () => {
    editor.method('entities:pasteComponent', (entities, component, data) => {
        entities = entities.slice();

        let previous = {};
        const redo = () => {
            previous = {};
            entities.forEach(e => {
                e = e.latest();
                if (!e) return;

                previous[e.get('resource_id')] = e.get('components.' + component);

                const history = e.history.enabled;
                e.history.enabled = false;
                e.set('components.' + component, data);
                e.history.enabled = history;
            });
        };

        const undo = () => {
            entities.forEach(e => {
                e = e.latest();
                if (!e) return;

                const history = e.history.enabled;
                e.history.enabled = false;
                if (!previous[e.get('resource_id')]) {
                    e.unset('components.' + component);
                } else {
                    e.set('components.' + component, previous[e.get('resource_id')]);
                }
                e.history.enabled = history;
            });
        };

        redo();

        editor.call('history:add', {
            name: `entities.paste[components.${component}]`,
            undo: undo,
            redo: redo
        });
    });
});
