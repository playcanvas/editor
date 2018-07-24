editor.once('load', function() {
    'use strict';

    var entity = null; // the entity that was clicked on to open the context menu
    var items = [ ];   // the current selection
    var customMenuItems = [ ];
    var root = editor.call('layout.root');

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    // Selenium's moveToObject (http://webdriver.io/api/action/moveToObject.html)
    // doesn't seem to work properly in terms of activating nested submenus in the
    // entities context menu. I spent a while trying various combinations of workarounds
    // from the Selenium side but nothing worked.
    //
    // This query string flag allows the submenus to be openable via mouse click,
    // which Selenium has no problem doing.
    var clickableSubmenus = /clickableContextSubmenus=true/.test(location.search);

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

    var hasLegacyScript = function (entity, url) {
        var scriptComponent = entity.get('components.script');
        if (scriptComponent) {
            for (var i = 0; i < scriptComponent.scripts.length; i++) {
                if (scriptComponent.scripts[i].url === url) {
                    return true;
                }
            }
        }

        return false;
    };

    var addBultinScript = function (entity, url) {
        if (! legacyScripts)
            return;

        var resourceId = entity.get('resource_id');

        var addedComponent = false;

        var action = {
            name: 'entity.' + resourceId + '.builtinscript',
            combine: false,
            undo: function () {
                var e = editor.call('entities:get', resourceId);
                if (! e) return;

                var history = e.history.enabled;
                e.history.enabled = false;

                if (addedComponent) {
                    e.unset('components.script');
                } else {
                    var scripts = e.get('components.script.scripts');
                    if (scripts) {
                        for (var i = 0; i < scripts.length; i++) {
                            if (scripts[i].url === url) {
                                e.remove('components.script.scripts', i);
                                break;
                            }
                        }
                    }
                }

                e.history.enabled = history;
            },
            redo: function () {
                var e = editor.call('entities:get', resourceId);
                if (! e) return;

                var history = e.history.enabled;
                e.history.enabled = false;

                if (!e.get('components.script')) {
                    editor.call('entities:addComponent', [e], 'script');
                    addedComponent = true;
                }

                // add script
                var script = new Observer({
                    url: url
                });
                e.insert('components.script.scripts', script);

                e.history.enabled = history;

                // scan script
                editor.call('sourcefiles:scan', url, function (data) {
                    e.history.enabled = false;

                    data.url = url;
                    script.patch(data);

                    e.history.enabled = history;
                });
            }
        };

        // perform action
        action.redo();

        // raise history event
        entity.history.emit('record', 'add', action);
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

        menuData['new-entity'] = {
            title: 'New Entity',
            filter: function() {
                return items.length === 1;
            },
            select: function () {
                editor.call('entities:new', {parent: items[0]});
            },
            items: editor.call('menu:entities:new', function () {return items[0];})
        };

        menuData['add-component'] = {
            title: 'Add Component',
            items: editor.call('menu:entities:add-component')
        };

        if (legacyScripts) {
            menuData['add-builtin-script'] = {
                title: 'Add Built-In Script',
                filter: function () {
                    return items.length === 1;
                },
                items: {
                    'post-effects': {
                        title: 'Post-Effects',
                        filter: function () {
                            return items.length === 1;
                        },
                        items: { }
                    },
                    'camera-scripts': {
                        title: 'Camera',
                        filter: function () {
                            return items.length === 1;
                        },
                        items: { }
                    }
                }
            };
        } else {
            // TODO scripts2
            // built-in scripts
        }

        menuData['enable'] = {
            title: 'Enable',
            icon: '&#57651;',
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
            icon: '&#57650;',
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
            icon: '&#58193;',
            select: function() {
                editor.call('entities:copy', items);
            }
        };

        menuData['paste'] = {
            title: 'Paste',
            icon: '&#58184;',
            filter: function () {
                return items.length <= 1 && ! editor.call('entities:clipboard:empty');
            },
            select: function() {
                editor.call('entities:paste', entity);
            }
        };

        menuData['duplicate'] = {
            title: 'Duplicate',
            icon: '&#57638;',
            filter: function () {
                var items = getSelection();

                if (items.indexOf(editor.call('entities:root')) !== -1)
                    return false;

                return items.length > 0;
            },
            select: function() {
                editor.call('entities:duplicate', getSelection());
            }
        };

        menuData['delete'] = {
            title: 'Delete',
            icon: '&#57636;',
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

        if (legacyScripts) {
            var builtInScripts = [{
                group: 'post-effects',
                title: 'Bloom',
                name: 'posteffect-bloom',
                url: 'https://code.playcanvas.com/posteffects/posteffect_bloom.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'Bloom',
                name: 'posteffect-bloom',
                url: 'https://code.playcanvas.com/posteffects/posteffect_bloom.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'Bloom',
                name: 'posteffect-bloom',
                url: 'https://code.playcanvas.com/posteffects/posteffect_bloom.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'Brightness-Contrast',
                name: 'posteffect-brightnesscontrast',
                url: 'https://code.playcanvas.com/posteffects/posteffect_brightnesscontrast.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'Hue-Saturation',
                name: 'posteffect-huesaturation',
                url: 'https://code.playcanvas.com/posteffects/posteffect_huesaturation.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'FXAA',
                name: 'posteffect-fxaa',
                url: 'https://code.playcanvas.com/posteffects/posteffect_fxaa.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'Sepia',
                name: 'posteffect-sepia',
                url: 'https://code.playcanvas.com/posteffects/posteffect_sepia.js',
                requires: 'camera'
            }, {
                group: 'post-effects',
                title: 'Vignette',
                name: 'posteffect-vignette',
                url: 'https://code.playcanvas.com/posteffects/posteffect_vignette.js',
                requires: 'camera'
            }, {
                group: 'camera-scripts',
                title: 'Fly Camera',
                name: 'camera-fly',
                url: 'https://code.playcanvas.com/camera/camera_fly.js',
                requires: 'camera'
            }];

            builtInScripts.forEach(function (data) {
                menuData['add-builtin-script'].items[data.group].items[data.name] = {
                    title: data.title,
                    filter: function () {
                        return items.length === 1 &&
                               editor.call('permissions:write') &&
                               !hasLegacyScript(items[0], data.url) &&
                               (!data.requires || items[0].get('components.' + data.requires));
                    },
                    select: function () {
                        addBultinScript(items[0], data.url);
                    }
                };
            });
        } else {
            // TODO scripts2
            // built-in scripts
        }

        // menu
        menu = ui.Menu.fromData(menuData, { clickableSubmenus: clickableSubmenus });
        root.append(menu);

        menu.on('open', function() {
            var selection = getSelection();

            for(var i = 0; i < customMenuItems.length; i++) {
                if (! customMenuItems[i].filter)
                    continue;

                customMenuItems[i].hidden = ! customMenuItems[i].filter(selection);
            }
        });
    });

    editor.method('entities:contextmenu:add', function(data) {
        var item = new ui.MenuItem({
            text: data.text,
            icon: data.icon,
            value: data.value,
            hasChildren: !!(data.items && Object.keys(data.items).length > 0),
            clickableSubmenus: clickableSubmenus
        });

        item.on('select', function() {
            data.select.call(item, getSelection());
        });

        var parent = data.parent || menu;
        parent.append(item);

        if (data.filter)
            item.filter = data.filter;

        customMenuItems.push(item);

        return item;
    });

    editor.method('entities:contextmenu:open', function(item, x, y, ignoreSelection) {
        if (! menu || ! editor.call('permissions:write')) return;

        entity = item;

        if (ignoreSelection) {
            items = [ ];
        } else {
            items = getSelection();
        }

        menu.open = true;
        menu.position(x + 1, y);

        return true;
    });

    // get the entity that was right-clicked when opening the context menu
    editor.method('entities:contextmenu:entity', function () {
        return entity;
    });

    // for each entity added
    editor.on('entities:add', function(item) {
        // get tree item
        var treeItem = editor.call('entities:panel:get', item.get('resource_id'));
        if (! treeItem) return;

        // attach contextmenu event
        treeItem.element.addEventListener('contextmenu', function(evt) {
            var openned = editor.call('entities:contextmenu:open', item, evt.clientX, evt.clientY);

            if (openned) {
                evt.preventDefault();
                evt.stopPropagation();
            }
        });
    });
});
