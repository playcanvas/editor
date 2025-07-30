editor.once('load', () => {
    /**
     * Given the root entity of the intended template,
     * create a template asset with new entity guids.
     * Set template-specific fields on the root to mark
     * it as a template instance.
     *
     * @param {object} root - The root entity
     */
    editor.method('assets:create:template', (root) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const parent = editor.call('assets:panel:currentFolder');

        const sceneEnts = editor.call('template:utils', 'getAllEntitiesInSubtree', root, []);

        const data = editor.call('template:newTemplateData', root, sceneEnts);

        const asset = {
            name: root.get('name'),
            type: 'template',
            source: false,
            parent: parent,
            data: data.assetData,
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset, (err, assetId) => {
            if (err) {
                return editor.call('status:error', err);
            }

            const onAssetCreated = () => {
                const history = root.history.enabled;
                root.history.enabled = false;
                root.set('template_id', parseInt(assetId, 10));
                root.set('template_ent_ids', data.srcToDst);
                root.history.enabled = history;
            };

            // check if asset exists first because of initial race condition
            // if it doesn't exist wait for it before setting template_id because
            // that will propagate other events which will fail if the asset is not there yet
            if (!editor.call('assets:get', assetId)) {
                editor.once(`assets:add[${assetId}]`, onAssetCreated);
            } else {
                onAssetCreated();
            }
        });
    });
});
