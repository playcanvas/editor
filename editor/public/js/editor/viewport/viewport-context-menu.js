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

        menuData['enable'] = {
            title: 'Enable',
            icon: '&#58421;',
            hide: function () {
                return currentEntity.get('enabled');
            },
            select: function() {
                currentEntity.set('enabled', true);
            }
        };

        menuData['disable'] = {
            title: 'Disable',
            icon: '&#58422;',
            hide: function () {
                return !currentEntity.get('enabled');
            },
            select: function() {
                currentEntity.set('enabled', false);
            }
        };

        menuData['duplicate'] = {
            title: 'Duplicate',
            icon: '&#57908;',
            filter: function () {
                return currentEntity !== editor.call('entities:root');
            },
            select: function() {
                editor.call('entities:duplicate', currentEntity);
            }
        };

        menuData['delete'] = {
            title: 'Delete',
            icon: '&#58657;',
            filter: function () {
                return currentEntity !== editor.call('entities:root');
            },
            select: function() {
                editor.call('entities:delete', currentEntity);
            }
        };


        // menu
        menu = ui.Menu.fromData(menuData);
        root.append(menu);
    });

    editor.method('viewport:contextmenu', function (x, y, entity) {
        if (! editor.call('permissions:write'))
            return;

        currentEntity = entity;
        menu.open = true;
        menu.position(x + 1, y);
    });
});
