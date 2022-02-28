editor.once('load', () => {
    editor.method('entities:pasteComponent', (entities, component, data) => {
        entities = entities.slice();

        let previous = {};
        let previousChildrenLayouts = {};
        const redo = () => {
            previous = {};
            previousChildrenLayouts = {};

            entities.forEach(e => {
                e = e.latest();
                if (!e) return;

                // 'layoutgroup' component immediately changes the layout (position, anchor, etc) for the entity's children.
                // Therefore, before adding the component, store all children layout info for undo
                if (component === 'layoutgroup') {
                    const entityChildrenLayouts = editor.call('entities:layout:getElementChildrenLayouts', e.get('children'));
                    previousChildrenLayouts[e.get('resource_id')] = entityChildrenLayouts;
                }

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

                // if the component was a layoutgroup, restore the old children layout data
                if (component === 'layoutgroup') {
                    const entityChildrenLayouts = previousChildrenLayouts[e.get('resource_id')];
                    editor.call('entities:layout:restoreElementChildrenLayouts', e.get('children'), entityChildrenLayouts);
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
