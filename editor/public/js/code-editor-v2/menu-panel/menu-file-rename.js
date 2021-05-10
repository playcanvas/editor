editor.once('load', function () {
    'use strict';
    var ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(ctxMenu.createItem('rename', {
        title: 'Rename',
        filter: function () {
            if (! editor.call('permissions:write')) return;

            var selected = editor.call('files:contextmenu:selected');
            return selected.length === 1;
        },
        select: function () {
            if (! editor.call('permissions:write')) return;

            var selected = editor.call('files:contextmenu:selected');
            if (selected.length < 1)
                return;

            var treeItem = editor.call('files:getTreeItem', selected[0].get('id'));
            if (treeItem)
                treeItem._onRename();
        }
    }));
});
