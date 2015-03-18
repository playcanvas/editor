editor.once('load', function() {
    'use strict';

    var currentEntity = null;
    var root = editor.call('layout.root');

    // create data for entity menu
    var menu;

    // wait until all entities are loaded
    // before creating the menu to make sure
    // that the menu data for entities have been created
    editor.once('entities:load', function () {
        var menuData = { };
        var entityMenuData = editor.call('menu:get', 'entity');
        if (entityMenuData) {
            for (var key in entityMenuData.items) {
                menuData[key] = entityMenuData.items[key];
            }
        }

        menuData['delete'] = {
            title: 'Delete',
            icon: '&#58657;',
            select: function() {
                editor.call('entities:delete', currentEntity);
            }
        };

        menuData['duplicate'] = {
            title: 'Duplicate',
            icon: '&#57908;',
            select: function() {
                editor.call('entities:duplicate', currentEntity);
            }
        }

        // menu
        menu = ui.Menu.fromData(menuData);
        root.append(menu);
    });

    editor.method('viewport:contextmenu', function (x, y, entity) {
        currentEntity = entity;
        menu.open = true;
        menu.position(x + 1, y);
    });
});
