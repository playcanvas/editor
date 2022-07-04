editor.once('load', function () {
    'use strict';

    var entity = null; // the entity that was clicked on to open the context menu
    var items = [];   // the current selection
    var root = editor.call('layout.root');

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // create data for entity menu
    var menu;

    var getSelection = function () {
        var selection = editor.call('selector:items');

        if (selection.indexOf(entity) !== -1) {
            return selection;
        }
        return [entity];

    };

    var setField = function (field, value) {
        var records = [];

        for (let i = 0; i < items.length; i++) {
            records.push({
                item: items[i],
                value: value,
                valueOld: items[i].get(field)
            });

            items[i].history.enabled = false;
            items[i].set(field, value);
            items[i].history.enabled = true;
        }

        editor.call('history:add', {
            name: 'entities.set[' + field + ']',
            undo: function () {
                for (let i = 0; i < records.length; i++) {
                    var item = records[i].item.latest();
                    if (!item)
                        continue;

                    item.history.enabled = false;
                    item.set(field, records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (let i = 0; i < records.length; i++) {
                    var item = records[i].item.latest();
                    if (!item)
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
        var menuData = [];

        const isOneSelected = () => items.length === 1;
        const hasWriteAccess = () => editor.call('permissions:write');

        menuData.push({
            text: 'New Entity',
            onIsEnabled: isOneSelected,
            onIsVisible: hasWriteAccess,
            onSelect: () => {
                editor.call('entities:new', { parent: items[0] });
            },
            items: editor.call('menu:entities:new', function () { return items[0]; })
        });

        menuData.push({
            text: 'Add Component',
            onIsVisible: hasWriteAccess,
            items: editor.call('menu:entities:add-component')
        });

        if (!legacyScripts) {
            menuData.push({
                text: 'Template',
                icon: 'E411',
                onIsEnabled: isOneSelected,
                onIsVisible: hasWriteAccess,
                items: editor.call('menu:entities:template')
            });
        }

        menuData.push({
            text: 'Enable',
            icon: 'E133',
            onIsVisible: function () {
                if (!hasWriteAccess()) return false;

                if (items.length === 1) {
                    return !items[0].get('enabled');
                }
                var enabled = items[0].get('enabled');
                for (let i = 1; i < items.length; i++) {
                    if (enabled !== items[i].get('enabled'))
                        return true;
                }
                return !enabled;

            },
            onSelect: function () {
                setField('enabled', true);
            }
        });

        menuData.push({
            text: 'Disable',
            icon: 'E132',
            onIsVisible: function () {
                if (!hasWriteAccess()) return false;

                if (items.length === 1) {
                    return items[0].get('enabled');
                }
                var disabled = items[0].get('enabled');
                for (let i = 1; i < items.length; i++) {
                    if (disabled !== items[i].get('enabled'))
                        return true;
                }
                return disabled;

            },
            onSelect: function () {
                setField('enabled', false);
            }
        });

        menuData.push({
            text: 'Copy',
            icon: 'E351',
            onSelect: function () {
                editor.call('entities:copy', items);
            }
        });

        menuData.push({
            text: 'Paste',
            icon: 'E348',
            onIsVisible: hasWriteAccess,
            onIsEnabled: function () {
                if (items.length <= 1) {
                    const clipboard = editor.call('clipboard:get');
                    if (clipboard && clipboard.type === 'entity') {
                        return true;
                    }
                }

                return false;
            },
            onSelect: function () {
                editor.call('entities:paste', entity);
            }
        });

        menuData.push({
            text: 'Duplicate',
            icon: 'E126',
            onIsVisible: hasWriteAccess,
            onIsEnabled: function () {
                var items = getSelection();

                if (items.indexOf(editor.call('entities:root')) !== -1)
                    return false;

                return items.length > 0;
            },
            onSelect: function () {
                editor.call('entities:duplicate', getSelection());
            }
        });

        menuData.push({
            text: 'Delete',
            icon: 'E124',
            onIsVisible: hasWriteAccess,
            onIsEnabled: function () {
                var root = editor.call('entities:root');
                for (let i = 0; i < items.length; i++) {
                    if (items[i] === root)
                        return false;
                }
                return true;
            },
            onSelect: function () {
                editor.call('entities:delete', items);
            }
        });

        menuData.push({
            text: 'Item History',
            icon: 'E399',
            onIsVisible: function () {
                return editor.call('permissions:write') && items.length === 1;
            },
            onSelect: function () {
                editor.call('vcgraph:utils', 'launchItemHist', 'entities', items[0].get('resource_id'));
            }
        });

        // menu
        menu = new pcui.Menu({ items: menuData });
        root.append(menu);
    });

    editor.method('entities:contextmenu:add', function (data) {
        var item = new pcui.MenuItem({
            text: data.text,
            icon: data.icon,
            items: data.items,
            onSelect: () => {
                data.onSelect.call(item, getSelection());
            },
            onIsEnabled: () => {
                if (data.onIsEnabled) {
                    return data.onIsEnabled.call(item, getSelection());
                }

                return true;
            },
            onIsVisible: () => {
                if (data.onIsVisible) {
                    return data.onIsVisible.call(item, getSelection());
                }

                return true;
            }
        });

        menu.append(item);

        return item;
    });

    editor.method('entities:contextmenu:open', function (item, x, y, ignoreSelection) {
        if (!menu ) return;

        entity = item;

        if (ignoreSelection) {
            items = [];
        } else {
            items = getSelection();
        }

        menu.hidden = false;
        menu.position(x + 1, y);

        return true;
    });

    // get the entity that was right-clicked when opening the context menu
    editor.method('entities:contextmenu:entity', function () {
        return entity;
    });

});
