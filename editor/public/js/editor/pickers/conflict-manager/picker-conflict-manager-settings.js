editor.once('load', function () {
    'use strict';

    var schema = {
        batchGroups: {
            '*': {
                layers: 'array:layer'
            }
        },
        scripts: 'array:asset',
        loadingScreenScript: 'asset',
        layers: {

        },
        layerOrder: {
            '*': {
                layer: 'layer'
            }
        }
    };

    var getType = function (path) {
        var parts = path.split('.');
        var target = schema;
        for (var p = 0; p < parts.length - 1; p++) {
            target = target[parts[p]] || target['*'];
            if (! target) {
                break;
            }
        }

        var result = target && target[parts[parts.length - 1]];
        if (! result) {
            console.warn('Unknown type for ' + path);
            result = 'string';
        }

        return result;
    };

    var appendFieldsToSection = function (fields, section, title, except) {
        var addedTitle = false;
        for (var field in fields)  {
            if (except && except.indexOf(field) !== -1) continue;

            var path = fields[field].path;
            if (! path) continue;

            if (! addedTitle && title) {
                addedTitle = true;
                section.appendTitle(title);
            }

            section.appendField({
                name: field,
                type: getType(path),
                conflict: fields[field],
                prettify: true
            });
        }
    };

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

    editor.method('picker:conflictManager:showSettingsConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        var index = {};

        // Build index of conflicts so that the conflicts become
        // a hierarchical object
        for (var i = 0, len = conflicts.data.length; i < len; i++) {
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
        appendFieldsToSection(index, sectionProperties, null, ['batchGroups', 'layers', 'layerOrder', 'scripts']);

        // Layers
        if (index.layers) {
            resolver.createSeparator('LAYERS');
            for (var key in index.layers) {
                var section = resolver.createSection('LAYER ' + getLayerName(key, mergeObject), true);
                appendFieldsToSection(index.layers[key], section, null);
            }
        }

        // Batch groups
        if (index.batchGroups) {
            resolver.createSeparator('BATCH GROUPS');
            for (var key in index.batchGroups) {
                var section = resolver.createSection('BATCH GROUP ' + getBatchGroupName(key, mergeObject), true);
                appendFieldsToSection(index.batchGroups[key], section, null);
            }
        }

        // Script order
        if (index.scripts) {
            resolver.createSeparator('SCRIPTS LOADING ORDER');
            var section = resolver.createSection('SCRIPTS', true);
            section.appendField({
                name: 'Order',
                type: 'array:asset',
                conflict: index.scripts
            });
        }

        resolver.appendToParent(parent);

        return resolver;
    });
});
