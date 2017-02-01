editor.once('load', function () {
    'use strict';

    var root = editor.call('layout.root');
    var menu = new ui.Menu();
    root.append(menu);

    menu.class.add('context');

    var currentAsset = null;

    // Return menu
    editor.method('files:contextmenu', function () {
        return menu;
    });

    // Get the assets that should be affected by the context menu
    // item
    editor.method('files:contextmenu:selected', function () {
        var selected = editor.call('assets:selected');
        if (! currentAsset) {
            return [];
        }

        if (selected.indexOf(currentAsset) !== -1) {
            return selected;
        } else {
            return [currentAsset];
        }
    });

    // show context menu for tree item
    editor.method('files:contextmenu:attach', function (treeItem) {
        var showMenu = function (e) {
            e.stopPropagation();
            e.preventDefault();

            currentAsset = editor.call('assets:get', treeItem._assetId);

            menu.open = true;
            menu.position(e.clientX + 1, e.clientY);
        };

        var el = treeItem.element;
        el.addEventListener('contextmenu', showMenu);
        treeItem.on('destroy', function () {
            el.removeEventListener('contextmenu', showMenu);
        });
    });
});