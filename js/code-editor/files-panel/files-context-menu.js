import { Menu } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');

    const menu = new Menu({
        class: 'context'
    });
    root.append(menu);

    let currentAsset = null;

    // Return menu
    editor.method('files:contextmenu', function () {
        return menu;
    });

    // Get the assets that should be affected by the context menu
    // item
    editor.method('files:contextmenu:selected', function () {
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
    editor.method('files:contextmenu:attach', function (treeItem) {
        const showMenu = function (e) {
            e.stopPropagation();
            e.preventDefault();

            currentAsset = editor.call('assets:get', treeItem._assetId);

            menu.hidden = false;
            menu.position(e.clientX + 1, e.clientY);
        };

        const el = treeItem.element;
        el.addEventListener('contextmenu', showMenu);
        treeItem.on('destroy', function () {
            el.removeEventListener('contextmenu', showMenu);
        });
    });
});
