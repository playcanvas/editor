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

        menuData['copy'] = {
            title: 'Copy',
            icon: '&#57891;',
            filter: function () {
                return true;
            },
            select: function() {
                editor.call('entities:copy', currentEntity);
            }
        };

        menuData['paste'] = {
            title: 'Paste',
            icon: '&#57892;',
            filter: function () {
                return true;
            },
            select: function() {
                editor.call('entities:paste', currentEntity);
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

    // for each entity added
    editor.on('entities:add', function(entity) {
        // get tree item
        var item = editor.call('entities:panel:get', entity.get('resource_id'));
        if (! item) return;

        // attach contextmenu event
        item.element.addEventListener('contextmenu', function(evt) {
            if (! menu || ! editor.call('permissions:write')) return;

            item.selected = true;

            currentEntity = entity;

            menu.open = true;
            menu.position(evt.clientX + 1, evt.clientY);

            evt.preventDefault();
            evt.stopPropagation();
        });
    });
});
