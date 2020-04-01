editor.once('load', function() {
    'use strict';

    function checkCircularReferences(entity, templateIds) {
        const templateId = entity.get('template_id');

        if (templateId) {
            if (templateIds[templateId]) {
                return true;
            }

            templateIds[templateId] = true;
        }

        const children = entity.get('children');
        for (let i = 0; i < children.length; i++) {
            const child = editor.call('entities:get', children[i]);
            if (!child) continue;

            if (checkCircularReferences(child, Object.assign({}, templateIds))) {
                return true;
            }
        }

        return false;
    }

    function checkCircularReferencesSingleOverride(root, override) {
        let entity = editor.call('entities:get', override.resource_id);

        const templateIds = {};

        while (entity) {
            const templateId = entity.get('template_id');
            if (templateId) {
                if (templateIds[templateId]) {
                    return true;
                }

                templateIds[templateId] = true;
            }

            if (entity === root) {
                break;
            }

            entity = editor.call('entities:get', entity.get('parent'));
        }

        return false;
    }

    function checkIfReparentedUnderNewEntity(root, override) {
        const templateEntIds = root.get('template_ent_ids');
        if (!templateEntIds) return;

        let parent = editor.call('entities:get', override.src_value);
        while (parent) {
            if (parent === root) break;

            if (!templateEntIds[parent.get('resource_id')]) {
                return parent;
            }

            parent = editor.call('entities:get', parent.get('parent'));
        }
    }

    const submitApplyTask = function (taskData, callback) {
        Object.assign(taskData, {
            branch_id: config.self.branch.id,
            project_id: config.project.id
        });

        var data = {
            url: '{{url.api}}/templates/apply',
            auth: true,
            method: 'POST',
            notJson: true,
            data: taskData
        };

        Ajax(data)
        .on('load', (status, data) => {
            if (callback) {
                callback(null, data);
            }
        })
        .on('error', (status, data) => {
            if (callback) {
                callback(data);
            }
        });
    };

    editor.method('templates:apply', function (root, callback) {
        if (! editor.call('permissions:write')) {
            return;
        }

        var resourceId = root.get('resource_id');

        var templateId = root.get('template_id');

        // check if there are any circular references
        if (checkCircularReferences(root, {})) {
            editor.call(
                'picker:confirm',
                "Template instances cannot contain children that are instances of the same template. Please remove those children and try applying again.",
                function () {},
                {
                    yesText: 'OK',
                    noText: ''
                });
            return false;
        }

        var taskData = {
            task_type: 'propagate_template_changes',
            entity_id: resourceId,
            template_id: templateId
        };

        submitApplyTask(taskData, callback);

        return true;
    });

    editor.method('templates:applyOverride', function (root, override, callback) {
        if (! editor.call('permissions:write')) {
            return;
        }

        var resourceId = root.get('resource_id');
        var templateId = root.get('template_id');

        // check if there are any circular references
        if (checkCircularReferencesSingleOverride(root, override)) {
            editor.call(
                'picker:confirm',
                "Template instances cannot contain children that are instances of the same template. Please remove those children and try applying again.",
                function () {},
                {
                    yesText: 'OK',
                    noText: ''
                });
            return false;
        }

        // check if this is a reparenting and if so do not allow it
        // if the entity was reparented under a new entity that has not been applied yet
        if (override.path === 'parent') {
            const newEntity = checkIfReparentedUnderNewEntity(root, override);
            if (newEntity) {
                editor.call(
                    'picker:confirm',
                    `This Entity was reparented under "${newEntity.get('name')}" which is a new Entity. Please apply "${newEntity.get('name')}" first.`,
                    function () {},
                    {
                        yesText: 'OK',
                        noText: ''
                    }
                );

                return false;
            }
        }

        var taskData = {
            task_type: 'propagate_single',
            entity_id: resourceId,
            resource_id: override.resource_id,
            template_id: templateId,
            overrides: [{
                type: override.override_type,
                path: override.path
            }]
        };

        if (override.path) {
            taskData.path = override.path;
        }

        submitApplyTask(taskData, callback);

        return true;
    });
});
