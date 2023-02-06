editor.once('load', function () {
    const getLayerName = function (id, mergeObject) {
        // try to get layer name from destination checkpoint first and if not
        // available try the source checkpoint
        return mergeObject.dstCheckpoint.settings.layers[id] ||
               mergeObject.srcCheckpoint.settings.layers[id] ||
               id;
    };

    const getBatchGroupName = function (id, mergeObject) {
        // try to get batch group name from destination checkpoint first and if not
        // available try the source checkpoint
        return mergeObject.dstCheckpoint.settings.batchGroups[id] ||
               mergeObject.srcCheckpoint.settings.batchGroups[id] ||
               id;
    };

    // Shows conflicts for project settings
    editor.method('picker:conflictManager:showSettingsConflicts', function (parent, conflicts, mergeObject) {
        const resolver = new ui.ConflictResolver(conflicts, mergeObject);

        // temp check to see if just all settings have changed with no
        // more details
        if (conflicts.data.length === 1 && conflicts.data[0].path === '') {
            const sectionSettings = resolver.createSection('PROJECT SETTINGS');
            sectionSettings.appendField({
                type: 'object',
                conflict: conflicts.data[0]
            });
            resolver.appendToParent(parent);
            return resolver;
        }

        // Build index of conflicts so that the conflicts become
        // a hierarchical object
        const index = {};
        for (let i = 0, len = conflicts.data.length; i < len; i++) {
            const conflict = conflicts.data[i];
            const parts = conflict.path.split('.');
            let target = index;

            for (let p = 0; p < parts.length - 1; p++) {
                if (!target.hasOwnProperty(parts[p])) {
                    target[parts[p]] = {};
                }
                target = target[parts[p]];
            }

            target[parts[parts.length - 1]] = conflict;
        }

        // Settings that need no special handling first
        const sectionProperties = resolver.createSection('SETTINGS');
        sectionProperties.appendAllFields({
            schema: 'settings',
            fields: index,
            except: ['batchGroups', 'layers', 'layerOrder', 'scripts']
        });

        // Layers
        if (index.layers || index.layerOrder) {
            resolver.createSeparator('LAYERS');
        }

        if (index.layers) {
            for (const key in index.layers) {
                const section = resolver.createSection('LAYER ' + getLayerName(key, mergeObject), true);
                section.appendAllFields({
                    schema: 'settings',
                    fields: index.layers[key]
                });
            }
        }

        if (index.layerOrder) {
            const section = resolver.createSection('LAYER ORDER', true);
            section.appendField({
                type: 'array:sublayer',
                conflict: index.layerOrder
            });
        }

        // Batch groups
        if (index.batchGroups) {
            resolver.createSeparator('BATCH GROUPS');
            for (const key in index.batchGroups) {
                const section = resolver.createSection('BATCH GROUP ' + getBatchGroupName(key, mergeObject), true);
                section.appendAllFields({
                    schema: 'settings',
                    fields: index.batchGroups[key]
                });
            }
        }

        // Script order
        if (index.scripts) {
            resolver.createSeparator('SCRIPTS LOADING ORDER');
            const section = resolver.createSection('SCRIPTS', true);
            section.appendField({
                type: 'array:asset',
                conflict: index.scripts
            });
        }

        resolver.appendToParent(parent);

        return resolver;
    });
});
