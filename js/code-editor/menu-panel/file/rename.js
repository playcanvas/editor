import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const ctxMenu = editor.call('files:contextmenu');
    ctxMenu.append(new MenuItem({
        text: 'Rename',
        onIsEnabled: () => {
            if (!editor.call('permissions:write')) return;

            const selected = editor.call('files:contextmenu:selected');
            return selected.length === 1;
        },
        onSelect: () => {
            if (!editor.call('permissions:write')) return;

            const selected = editor.call('files:contextmenu:selected');
            if (selected.length < 1)
                return;

            const treeItem = editor.call('files:getTreeItem', selected[0].get('id'));
            if (treeItem)
                treeItem.rename();
        }
    }));
});
