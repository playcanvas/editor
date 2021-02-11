editor.once('load', function () {
    'use strict';

    var getLayerName = function (id, mergeObject) {
        // try to get layer name from destination checkpoint first and if not
        // available try the source checkpoint
        return mergeObject.dstCheckpoint.settings.layers[id] ||
               mergeObject.srcCheckpoint.settings.layers[id] ||
               id;
    };

    var getBatchGroupName = function (id, mergeObject) {
        // try to get batch group name from destination checkpoint first and if not
        // available try the source checkpoint
        return mergeObject.dstCheckpoint.settings.batchGroups[id] ||
               mergeObject.srcCheckpoint.settings.batchGroups[id] ||
               id;
    };

    // Shows conflicts for project settings
    editor.method('picker:conflictManager:showSettingsConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        // temp check to see if just all settings have changed with no
        // more details
        if (conflicts.data.length === 1 && conflicts.data[0].path === '') {
            var sectionSettings = resolver.createSection('PROJECT SETTINGS');
            sectionSettings.appendField({
                type: 'object',
                conflict: conflicts.data[0]
            });
            resolver.appendToParent(parent);
            return resolver;
        }

        // Build index of conflicts so that the conflicts become
        // a hierarchical object
        var index = {};
        for (let i = 0, len = conflicts.data.length; i < len; i++) {
            var conflict = conflicts.data[i];
            var parts = conflict.path.split('.');
            var target = index;

            for (var p = 0; p < parts.length - 1; p++) {
                if (! target.hasOwnProperty(parts[p])) {
                    target[parts[p]] = {};
                }
                target = target[parts[p]];
            }

            target[parts[parts.length - 1]] = conflict;
        }

        // Settings that need no special handling first
        var sectionProperties = resolver.createSection('SETTINGS');
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
            for (var key in index.layers) {
                var section = resolver.createSection('LAYER ' + getLayerName(key, mergeObject), true);
                section.appendAllFields({
                    schema: 'settings',
                    fields: index.layers[key]
                });
            }
        }

        if (index.layerOrder) {
            var section = resolver.createSection('LAYER ORDER', true);
            section.appendField({
                type: 'array:sublayer',
                conflict: index.layerOrder
            });
        }

        // Batch groups
        if (index.batchGroups) {
            resolver.createSeparator('BATCH GROUPS');
            for (var key in index.batchGroups) {
                var section = resolver.createSection('BATCH GROUP ' + getBatchGroupName(key, mergeObject), true);
                section.appendAllFields({
                    schema: 'settings',
                    fields: index.batchGroups[key]
                });
            }
        }

        // Script order
        if (index.scripts) {
            resolver.createSeparator('SCRIPTS LOADING ORDER');
            var section = resolver.createSection('SCRIPTS', true);
            section.appendField({
                type: 'array:asset',
                conflict: index.scripts
            });
        }

        resolver.appendToParent(parent);

        return resolver;
    });
});
