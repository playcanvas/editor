editor.once('load', function () {
    var projectSettings = editor.call('settings:project');

    editor.method('editorSettings:batchGroups:create', (name) => {
        const batchGroups = projectSettings.get('batchGroups');

        // calculate id of new group and new name
        let id = 100000;
        for (const key in batchGroups) {
            id = Math.max(parseInt(key, 10) + 1, id);
        }

        projectSettings.set('batchGroups.' + id, {
            id: id,
            name: name || 'New Batch Group',
            maxAabbSize: 100,
            dynamic: true
        });

        return id;
    });
});
