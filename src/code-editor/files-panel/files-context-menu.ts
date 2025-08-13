import { Menu, type Container, type TreeViewItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const root: Container = editor.call('layout.root');

    const menu = new Menu({
        class: 'context'
    });
    root.append(menu);

    let currentAsset = null;

    // Return menu
    editor.method('files:contextmenu', () => {
        return menu;
    });

    // Get the assets that should be affected by the context menu
    // item
    editor.method('files:contextmenu:selected', () => {
        const selected = editor.call('assets:selected');
        if (!currentAsset) {
            return [];
        }

        if (selected.indexOf(currentAsset) !== -1) {
            return selected;
        }

        return [currentAsset];
    });

    // show context menu for tree item
    editor.method('files:contextmenu:attach', (treeItem: TreeViewItem) => {
        const showMenu = function (e) {
            e.stopPropagation();
            e.preventDefault();

            currentAsset = editor.call('assets:get', treeItem._assetId);

            menu.hidden = false;
            menu.position(e.clientX + 1, e.clientY);
        };

        const el = treeItem.dom;
        el.addEventListener('contextmenu', showMenu);
        treeItem.on('destroy', () => {
            el.removeEventListener('contextmenu', showMenu);
        });
    });
});
