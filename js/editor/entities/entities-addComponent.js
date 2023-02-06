editor.once('load', function () {
    /**
     * Adds the specified component to the specified entities.
     *
     * @param {Observer[]} entities - The entities
     * @param {string} component - The name of the component
     * @param {object} componentData - The object containing additional parameters used to build new component
     */
    editor.method('entities:addComponent', function (entities, component, componentData = {}) {
        let previousChildrenLayouts = {};

        function redo() {
            previousChildrenLayouts = {};

            entities = entities.map(e => e.latest()).filter(e => !!e && !e.has('components.' + component));
            entities.forEach((e) => {
                const history = e.history.enabled;
                e.history.enabled = false;

                // 'layoutgroup' component immediately changes the layout (position, anchor, etc) for the entity's children.
                // Therefore, before adding the component, store all children layout info for undo
                if (component === 'layoutgroup') {
                    const entityChildrenLayouts = editor.call('entities:layout:getElementChildrenLayouts', e.get('children'));
                    previousChildrenLayouts[e.get('resource_id')] = entityChildrenLayouts;
                }

                try {
                    e.apiEntity.addComponent(component, componentData);
                } catch (err) {
                    console.error(err);
                    editor.call(
                        'status:error',
                        `Could not add ${component} component to entity ${e.get('resource_id')}`
                    );
                }
                e.history.enabled = history;
            });
        }

        function undo() {
            entities.forEach((e) => {
                e = e.latest();
                if (!e) return;

                const history = e.history.enabled;
                e.history.enabled = false;
                try {
                    e.apiEntity.removeComponent(component);
                } catch (err) {
                    console.error(err);
                    editor.call(
                        'status:error',
                        `Could not remove ${component} component from entity ${e.get('resource_id')}`
                    );
                }

                // if the component was a layoutgroup, restore the old children layout data
                if (component === 'layoutgroup') {
                    const entityChildrenLayouts = previousChildrenLayouts[e.get('resource_id')];
                    editor.call('entities:layout:restoreElementChildrenLayouts', e.get('children'), entityChildrenLayouts);
                }

                e.history.enabled = history;
            });
        }

        redo();

        editor.history.add({
            name: 'entities.' + component,
            undo: undo,
            redo: redo
        });
    });
});
