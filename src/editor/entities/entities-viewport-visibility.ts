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

    editor.method('entities:visibility:set', (resourceId: string, hidden: boolean) => {
        const wasHidden = hiddenEntities.has(resourceId);
        if (wasHidden === hidden) {
            return;
        }

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
        editor.call('viewport:render');
    });

    editor.method('entities:visibility:toggle', (resourceId: string) => {
        const hidden = !hiddenEntities.has(resourceId);
        editor.call('entities:visibility:set', resourceId, hidden);
    });

    editor.on('entities:clear', () => {
        hiddenEntities.clear();
    });
});
