editor.once('load', function () {
    'use strict';

    // Shows conflicts for project settings
    editor.method('picker:conflictManager:showAssetConflicts', function (parent, conflicts, mergeObject) {
        var resolver = new ui.ConflictResolver(conflicts, mergeObject);

        var sectionAsset = resolver.createSection(conflicts.itemName + ' - ID: ' + conflicts.itemId);
        sectionAsset.appendField({
            type: 'object',
            conflict: conflicts.data[0]
        });

        resolver.appendToParent(parent);
        return resolver;
    });
});
