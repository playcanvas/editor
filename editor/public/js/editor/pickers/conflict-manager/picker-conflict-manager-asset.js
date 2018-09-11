editor.once('load', function () {
    'use strict';

    // Shows asset field conflicts
    editor.method('picker:conflictManager:showAssetFieldConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        var sectionAsset = resolver.createSection(conflicts.itemName + ' - ID: ' + conflicts.itemId);

        for (var i = 0; i < conflicts.data.length; i++) {
            if (conflicts.data[i].isTextualMerge) continue;

            sectionAsset.appendField({
                name: conflicts.data[i].path,
                prettify: true,
                type: editor.call('schema:asset:getType', conflicts.data[i].path),
                conflict: conflicts.data[i]
            });
        }

        resolver.appendToParent(parent);
        return resolver;
    });

    // Shows asset text file contents
    editor.method('picker:conflictManager:showAssetFileConflicts', function (parent, conflicts) {
        var resolver = new ui.TextResolver(conflicts);
        resolver.appendToParent(parent);
        return resolver;
    });
});
