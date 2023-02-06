editor.once('load', function () {
    editor.method('templates:unlink', function (entity) {
        if (!editor.call('permissions:write')) {
            return;
        }

        let templateId, template_ent_ids;

        function undo() {
            entity = entity.latest();
            if (!entity) return;

            const history = entity.history.enabled;
            entity.history.enabled = false;

            // if template asset does not exist anymore then skip undo
            const asset = editor.call('assets:get', templateId);
            if (!asset) return;

            // remove invalid entries from template_ent_ids
            for (const id in template_ent_ids) {
                if (!asset.has(`data.entities.${template_ent_ids[id]}`)) {
                    delete template_ent_ids[id];
                }
            }

            entity.set('template_id', templateId);
            entity.set('template_ent_ids', template_ent_ids);

            entity.history.enabled = history;
        }

        function redo() {
            entity = entity.latest();
            if (!entity) return;

            templateId = entity.get('template_id');
            template_ent_ids = entity.get('template_ent_ids');

            if (!templateId) {
                return;
            }

            const history = entity.history.enabled;
            entity.history.enabled = false;
            entity.unset('template_id');
            entity.unset('template_ent_ids');
            entity.history.enabled = history;
        }

        editor.call('history:add', {
            name: 'unlink template',
            undo: undo,
            redo: redo
        });

        redo();
    });
});
