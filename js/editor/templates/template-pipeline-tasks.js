editor.once('load', function () {
    const jobsInProgress = {};

    function randomGuid() {
        return pc.guid.create().substring(0, 8);
    }

    function addJob(jobId, callback) {
        jobsInProgress[jobId] = callback;
        editor.call('status:job', jobId, 1);
    }

    function removeJob(jobId, result) {
        if (jobsInProgress.hasOwnProperty(jobId)) {
            editor.call('status:job', jobId);

            const callback = jobsInProgress[jobId];
            if (callback) {
                callback(result);
            }
            delete jobsInProgress[jobId];
        }
    }

    editor.on('messenger:template.apply', (data) => {
        removeJob(data.job_id);
    });

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

    editor.method('templates:apply', function (root) {
        if (!editor.call('permissions:write')) {
            return;
        }

        var resourceId = root.get('resource_id');

        var templateId = root.get('template_id');
        const templateAsset = editor.call('assets:get', templateId);
        if (!templateAsset) {
            return;
        }

        // check if there are any circular references
        if (checkCircularReferences(root, {})) {
            editor.call(
                'picker:confirm',
                "Template instances cannot contain children that are instances of the same template. Please remove those children and try applying again.",
                function () { },
                {
                    yesText: 'OK',
                    noText: ''
                });
            return false;
        }

        const jobId = randomGuid();

        editor.call('realtime:send', 'pipeline', {
            name: 'template-apply',
            data: {
                jobId: jobId,
                entityId: resourceId,
                templateId: templateAsset.get('uniqueId'),
                templateItemId: templateId,
                branchId: config.self.branch.id
            }
        });

        addJob(jobId);

        return true;
    });

    editor.method('templates:applyOverride', function (root, override) {
        if (!editor.call('permissions:write')) {
            return;
        }

        var resourceId = root.get('resource_id');
        var templateId = root.get('template_id');
        const templateAsset = editor.call('assets:get', templateId);
        if (!templateAsset) return;

        // check if there are any circular references
        if (checkCircularReferencesSingleOverride(root, override)) {
            editor.call(
                'picker:confirm',
                "Template instances cannot contain children that are instances of the same template. Please remove those children and try applying again.",
                function () { },
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
                    function () { },
                    {
                        yesText: 'OK',
                        noText: ''
                    }
                );

                return false;
            }
        }

        const jobId = randomGuid();

        const taskData = {
            entityId: resourceId,
            templateId: templateAsset.get('uniqueId'),
            templateItemId: templateAsset.get('id'),
            branchId: config.self.branch.id,
            resourceId: override.resource_id,
            overrides: [{
                type: override.override_type,
                path: override.path
            }],
            jobId: jobId
        };

        if (override.path) {
            taskData.path = override.path;
        }

        editor.call('realtime:send', 'pipeline', {
            name: 'template-apply-override',
            data: taskData
        });

        addJob(jobId);

        return true;
    });
});
