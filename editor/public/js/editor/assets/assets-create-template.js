editor.once('load', function () {
    'use strict';

    /**
     * Given the root entity of the intended template,
     * create a template asset with new entity guids.
     * Set template-specific fields on the root to mark
     * it as a template instance.
     *
     * @param {Object} root The root entity
     */
    editor.method('assets:create:template', function (root) {
        if (! editor.call('permissions:write')) {
            return;
        }

        const parent = editor.call('assets:panel:currentFolder');

        const sceneEnts = editor.call('template:utils', 'getAllEntitiesInSubtree', root, []);

        const data = editor.call('template:newTemplateData', root, sceneEnts);

        const asset = {
            name: root.get('name'),
            type: 'template',
            source: false,
            preload: true,
            parent: parent,
            data:  data.assetData,
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset, function (err, assetId) {
            if (!err) {
                onAssetCreated(root, assetId, data.srcToDst);
            }
        });
    });

    const onAssetCreated = function (root, assetId, srcToDst) {
        const templId = parseInt(assetId, 10);

        root.set('template_id', templId);

        root.set('template_ent_ids', srcToDst);
    };
});
