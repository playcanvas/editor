// TODO: Better types once available
type Entity = any;
type SnapshotEntry = {
    entityId: any;
    templateId: any;
    template_ent_ids: any;
};

editor.once('load', () => {
    function extractEntityIds(entities: Entity | Entity[]): string[] {
        if (!Array.isArray(entities)) {
            entities = [entities];
        }
        return entities.filter(e => e.get('template_id')).map(e => e.get('resource_id'));
    }

    editor.method('templates:unlink', (entities: Entity | Entity[]) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const entityIds = extractEntityIds(entities);
        let snapshots: SnapshotEntry[] = [];

        function undo() {
            snapshots.forEach(({ entityId, template_ent_ids, templateId }) => {
                const entity = editor.call('entities:get', entityId);
                if (!entity) {
                    return;
                }

                const asset = editor.call('assets:get', templateId);
                if (!asset) {
                    return;
                }

                // remove invalid entries from template_ent_ids
                for (const id in template_ent_ids) {
                    if (!asset.has(`data.entities.${template_ent_ids[id]}`)) {
                        delete template_ent_ids[id];
                    }
                }

                const history = entity.history.enabled;
                entity.history.enabled = false;
                entity.set('template_id', templateId);
                entity.set('template_ent_ids', template_ent_ids);
                entity.history.enabled = history;
            });
        }

        function redo() {
            snapshots = [];

            entityIds.forEach((entityId) => {
                const entity = editor.call('entities:get', entityId);
                if (!entity) {
                    return;
                }

                const templateId = entity.get('template_id');
                const template_ent_ids = entity.get('template_ent_ids');

                if (!templateId) {
                    return;
                }

                snapshots.push({
                    entityId,
                    templateId,
                    template_ent_ids
                });

                const history = entity.history.enabled;
                entity.history.enabled = false;
                entity.unset('template_id');
                entity.unset('template_ent_ids');
                entity.history.enabled = history;
            });
        }

        editor.api.globals.history.add({
            name: 'unlink template',
            combine: false,
            undo,
            redo
        });

        redo();
    });
});
