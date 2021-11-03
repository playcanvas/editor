editor.once('load', function () {
    'use strict';

    /**
     * Adds the specified component to the specified entities.
     *
     * @param {Observer[]} entities - The entities
     * @param {string} component - The name of the component
     */
    editor.method('entities:addComponent', function (entities, component) {
        function redo() {
            entities = entities.map(e => e.latest()).filter(e => !!e && !e.has('components.' + component));
            entities.forEach(e => {
                const history = e.history.enabled;
                e.history.enabled = false;
                try {
                    e.apiEntity.addComponent(component);
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
            entities.forEach(e => {
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
