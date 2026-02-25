/**
 * Manages viewport-only visibility state for entities. This state is session-only,
 * not persisted, and not synced via realtime. It controls whether entities are
 * visible in the editor viewport without modifying the entity's `enabled` Observer data.
 */
editor.once('load', () => {
    const hiddenEntities: Set<string> = new Set();

    editor.method('entities:visibility:isHidden', (resourceId: string): boolean => {
        return hiddenEntities.has(resourceId);
    });

    const applyOne = (resourceId: string, hidden: boolean) => {
        if (hidden) {
            hiddenEntities.add(resourceId);
        } else {
            hiddenEntities.delete(resourceId);
        }

        const app = editor.call('viewport:app');
        if (app) {
            const entity = app.root.findByGuid(resourceId);
            if (entity) {
                const obj = editor.call('entities:get', resourceId);
                const observerEnabled = obj ? obj.get('enabled') : true;
                entity.enabled = observerEnabled && !hidden;
            }
        }

        editor.emit('entities:visibility:changed', resourceId, hidden);
    };

    editor.method('entities:visibility:set', (resourceIds: string | string[], hidden: boolean, history: boolean = true) => {
        const ids = Array.isArray(resourceIds) ? resourceIds : [resourceIds];
        const changed: string[] = [];
        for (const id of ids) {
            if (hiddenEntities.has(id) !== hidden) {
                changed.push(id);
            }
        }
        if (!changed.length) {
            return;
        }

        if (history) {
            editor.api.globals.history.add({
                name: 'entities.visibility',
                combine: false,
                undo: () => {
                    for (const id of changed) {
                        applyOne(id, !hidden);
                    }
                    editor.call('viewport:render');
                },
                redo: () => {
                    for (const id of changed) {
                        applyOne(id, hidden);
                    }
                    editor.call('viewport:render');
                }
            });
        }

        for (const id of changed) {
            applyOne(id, hidden);
        }
        editor.call('viewport:render');
    });

    editor.method('entities:visibility:getHidden', (): string[] => {
        return [...hiddenEntities];
    });

    editor.method('entities:visibility:toggle', (resourceId: string) => {
        const hidden = !hiddenEntities.has(resourceId);
        editor.call('entities:visibility:set', resourceId, hidden);
    });

    editor.on('entities:clear', () => {
        hiddenEntities.clear();
    });

    editor.on('entities:remove', (resourceId: string) => {
        hiddenEntities.delete(resourceId);
    });
});
