import type { EntityObserver } from '@/editor-api';

editor.once('load', () => {
    /**
     * Adds the specified component to the specified entities.
     *
     * @param entities - The entities
     * @param component - The name of the component
     * @param componentData - The object containing additional parameters used to build new component
     */
    editor.method('entities:addComponent', (entities: EntityObserver[], component: string, componentData: Record<string, unknown> = {}) => {
        let previousChildrenLayouts = {};

        function redo() {
            previousChildrenLayouts = {};

            entities = entities.map(e => e.latest()).filter(e => !!e && !e.has(`components.${component}`)) as EntityObserver[];
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
                e = e.latest() as EntityObserver;
                if (!e) {
                    return;
                }

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

        editor.api.globals.history.add({
            name: `entities.${component}`,
            combine: false,
            undo: undo,
            redo: redo
        });
    });
});
