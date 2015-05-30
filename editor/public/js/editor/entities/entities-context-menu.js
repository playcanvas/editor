editor.once('load', function() {
    'use strict';

    var entity = null;
    var items = [ ];
    var root = editor.call('layout.root');

    // create data for entity menu
    var menu;

    var getSelection = function() {
        var selection = editor.call('selector:items');

        if (selection.indexOf(entity) !== -1) {
            return selection;
        } else {
            return [ entity ];
        }
    };

    var setField = function(field, value) {
        var records = [ ];

        for(var i = 0; i < items.length; i++) {
            records.push({
                get: items[i].history._getItemFn,
                value: value,
                valueOld: items[i].get(field)
            });

            items[i].history.enabled = false;
            items[i].set(field, value);
            items[i].history.enabled = true;
        }

        editor.call('history:add', {
            name: 'entities.set[' + field + ']',
            undo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set(field, records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var item = records[i].get();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set(field, records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    };

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
                if (items.length === 1) {
                    return items[0].get('enabled');
                } else {
                    var enabled = items[0].get('enabled');
                    for(var i = 1; i < items.length; i++) {
                        if (enabled !== items[i].get('enabled'))
                            return false;
                    }
                    return enabled;
                }
            },
            select: function() {
                setField('enabled', true);
            }
        };

        menuData['disable'] = {
            title: 'Disable',
            icon: '&#58422;',
            hide: function () {
                if (items.length === 1) {
                    return ! items[0].get('enabled');
                } else {
                    var disabled = items[0].get('enabled');
                    for(var i = 1; i < items.length; i++) {
                        if (disabled !== items[i].get('enabled'))
                            return false;
                    }
                    return ! disabled;
                }
            },
            select: function() {
                setField('enabled', false);
            }
        };

        menuData['copy'] = {
            title: 'Copy',
            icon: '&#57891;',
            filter: function() {
                return items.length === 1;
            },
            select: function() {
                editor.call('entities:copy', entity);
            }
        };

        menuData['paste'] = {
            title: 'Paste',
            icon: '&#57892;',
            filter: function () {
                return items.length === 1 && ! editor.call('entities:clipboard:empty');
            },
            select: function() {
                editor.call('entities:paste', entity);
            }
        };

        menuData['duplicate'] = {
            title: 'Duplicate',
            icon: '&#57908;',
            filter: function () {
                return items.length === 1 && entity !== editor.call('entities:root');
            },
            select: function() {
                editor.call('entities:duplicate', entity);
            }
        };

        // TODO
        menuData['delete'] = {
            title: 'Delete',
            icon: '&#58657;',
            filter: function () {
                var root = editor.call('entities:root');
                for(var i = 0; i < items.length; i++) {
                    if (items[i] === root)
                        return false;
                }
                return true;
            },
            select: function() {
                editor.call('entities:delete', items);
            }
        };


        // menu
        menu = ui.Menu.fromData(menuData);
        root.append(menu);

        var extraFilters = {
            'new-entity': function() {
                return items.length === 1;
            },
            'add-component': function() {
                return items.length === 1;
            },
            'add-builtin-script': function() {
                return items.length === 1;
            }
        };

        menu.on('open', function() {
            for(var key in entityMenuData.items) {
                if (! extraFilters[key])
                     continue;

                var menuItem = menu.findByPath(key);

                if (menuItem.disabled)
                    continue;

                menuItem.enabled = extraFilters[key]();
            }
        });
    });

    // for each entity added
    editor.on('entities:add', function(item) {
        // get tree item
        var treeItem = editor.call('entities:panel:get', item.get('resource_id'));
        if (! treeItem) return;

        // attach contextmenu event
        treeItem.element.addEventListener('contextmenu', function(evt) {
            if (! menu || ! editor.call('permissions:write')) return;

            entity = item;
            items = getSelection();

            menu.open = true;
            menu.position(evt.clientX + 1, evt.clientY);

            evt.preventDefault();
            evt.stopPropagation();
        });
    });
});
