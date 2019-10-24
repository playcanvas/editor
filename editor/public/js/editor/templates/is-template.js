editor.once('load', function () {
    'use strict';

    editor.method('templates:isTemplateChild', function (entity) {
        const templateEntIdsPath = `template_ent_ids.${entity.get('resource_id')}`;

        let current = entity;
        while (true) {
            const parent = current.get('parent');
            if (!parent) {
                break;
            }

            current = editor.call('entities:get', parent);
            if (!current) {
                break;
            }

            if (current.get('template_id') && current.get(templateEntIdsPath)) {
                return true;
            }
        }

        return false;
    });
});
