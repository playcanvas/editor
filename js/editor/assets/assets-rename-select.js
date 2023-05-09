editor.once('load', function () {
    var onRename = function () {
        if (!editor.call('permissions:write'))
            return;

        var type = editor.call('selector:type');
        if (type !== 'asset')
            return;

        var items = editor.call('selector:items');
        if (items.length !== 1)
            return;

        var root = editor.call('attributes.rootPanel');
        if (!root?.content)
            return;

        root.content.forEachChild((c) => {
            const field = c?._attributesInspector?.getField('name');
            if (field) {
                field.flash();
                field.focus();
                return false;
            }
            return true;
        });
    };

    editor.method('assets:rename-select', onRename);

    editor.call('hotkey:register', 'assets:rename-select', {
        key: 'n',
        callback: onRename
    });

    editor.call('hotkey:register', 'assets:rename-select:f2', {
        key: 'f2',
        callback: onRename
    });
});
