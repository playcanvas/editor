editor.once('load', function () {
    // Checks if the entity is part of a template and if so returns the template
    // root or null otherwise
    editor.method('templates:isTemplateChild', function (entity, entities) {
        const templateEntIdsPath = `template_ent_ids.${entity.get('resource_id')}`;

        let current = entity;
        while (true) {
            const parent = current.get('parent');
            if (!parent) {
                break;
            }

            if (entities) {
                current = entities.get(parent);
            } else {
                current = editor.call('entities:get', parent);
            }

            if (!current) {
                break;
            }

            if (current.get('template_id') && current.get(templateEntIdsPath)) {
                return current;
            }
        }

        return null;
    });
});
