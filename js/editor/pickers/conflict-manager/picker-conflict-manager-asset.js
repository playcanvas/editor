editor.once('load', function () {
    // Shows asset field conflicts
    editor.method('picker:conflictManager:showAssetFieldConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        var sectionAsset = resolver.createSection(conflicts.itemName + ' - ID: ' + conflicts.itemId);

        var sectionData;
        var sectionEntities = {};

        for (let i = 0; i < conflicts.data.length; i++) {
            if (conflicts.data[i].isTextualMerge) continue;

            // get the type from the path - force 'data' to be an object for now
            var path = conflicts.data[i].path;
            var noPath = !path;
            var isData = path && path.startsWith('data.');
            var type;
            if (isData && conflicts.assetType) {
                type = editor.call('schema:asset:getDataType', conflicts.assetType, path);
            } else {
                type = !path || path === 'data' ? 'object' : editor.call('schema:asset:getType', path);
            }

            let section = sectionAsset;
            if (isData) {
                if (!sectionData) {
                    sectionData = resolver.createSection('DATA');
                }

                section = sectionData;
                // cut data.
                path = path.substring(5);

                if (path.startsWith('entities.')) {
                    const parts = path.split('.');
                    const resourceId = parts[1];
                    section = sectionEntities[resourceId];
                    if (!section) {
                        section = resolver.createSection('Entity ' + resourceId);
                        sectionEntities[resourceId] = section;
                    }
                    path = parts.slice(2).join('.');
                }
            }

            section.appendField({
                name: path,
                noPath: noPath,
                prettify: !path || !path.startsWith('data'),
                type: type,
                conflict: conflicts.data[i]
            });
        }

        resolver.appendToParent(parent);
        return resolver;
    });

    // Shows asset text file contents
    editor.method('picker:conflictManager:showAssetFileConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.TextResolver(conflicts, mergeObject);
        resolver.appendToParent(parent);
        return resolver;
    });
});
