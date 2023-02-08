import { Button, Menu } from '@playcanvas/pcui';

editor.once('load', function () {
    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var history = editor.call('editor:history');

    var logo = new Button();
    logo.class.add('logo');
    toolbar.append(logo);

    var setField = function (items, field, value) {
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

        history.add({
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

    var menu = new Menu({
        items: [{
            text: 'Entity',
            onIsEnabled: function () {
                return editor.call('selector:type') === 'entity' && editor.call('permissions:write');
            },
            items: [{
                text: 'New Entity',
                onIsEnabled: function () {
                    return editor.call('selector:items').length === 1;
                },
                onSelect: function () {
                    editor.call('entities:new', { parent: editor.call('entities:selectedFirst') });
                },
                items: editor.call('menu:entities:new')
            }, {
                text: 'Add Component',
                onIsEnabled: function () {
                    return editor.call('selector:type') === 'entity';
                },
                items: editor.call('menu:entities:add-component')
            }, {
                text: 'Template',
                onIsEnabled: () => {
                    return editor.call('selector:type') === 'entity' &&
                           editor.call('selector:items').length === 1;
                },
                onIsVisible: () => {
                    return !legacyScripts;
                },
                items: editor.call('menu:entities:template')
            }]
        }, {
            text: 'Edit',
            onIsEnabled: function () {
                return editor.call('permissions:write');
            },
            items: [{
                text: 'Undo',
                icon: 'E114',
                onIsEnabled: function () {
                    return history.canUndo;
                },
                onSelect: function () {
                    return history.undo();
                }
            }, {
                text: 'Redo',
                icon: 'E115',
                onIsEnabled: function () {
                    return history.canRedo;
                },
                onSelect: function () {
                    history.redo();
                }
            }, {
                text: 'Enable',
                icon: 'E133',
                onIsEnabled: function () {
                    if (!editor.call('permissions:write'))
                        return false;

                    return editor.call('selector:type') === 'entity';
                },
                onIsVisible: function () {
                    var type = editor.call('selector:type');
                    if (type !== 'entity')
                        return false;

                    var items = editor.call('selector:items');

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
                    setField(editor.call('selector:items'), 'enabled', true);
                }
            }, {
                text: 'Disable',
                icon: 'E132',
                onIsEnabled: function () {
                    if (!editor.call('permissions:write'))
                        return false;

                    return editor.call('selector:type') === 'entity';
                },
                onIsVisible: function () {
                    var type = editor.call('selector:type');
                    if (type !== 'entity')
                        return false;

                    var items = editor.call('selector:items');

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
                    setField(editor.call('selector:items'), 'enabled', false);
                }
            }, {
                text: 'Copy',
                icon: 'E351',
                onIsEnabled: function () {
                    const selector = editor.call('selector:type');
                    if (selector === 'asset' && editor.call('assets:panel:currentFolder') === 'scripts') {
                        return false;
                    }

                    if (selector === 'entity') {
                        return editor.call('selector:items').length;
                    }

                    if (selector === 'asset') {
                        return editor.call('selector:items').length;
                    }

                    return false;
                },
                onSelect: function () {
                    var items = editor.call('selector:items');
                    const selector = editor.call('selector:type');
                    if (selector === 'entity') {
                        editor.call('entities:copy', items);
                    } else if (selector === 'asset') {
                        editor.call('assets:copy', items);
                    }
                }
            }, {
                text: 'Paste',
                icon: 'E348',
                onIsEnabled: function () {
                    if (!editor.call('permissions:write')) {
                        return false;
                    }

                    const clipboard = editor.call('clipboard');
                    const value = clipboard.value;
                    if (value) {
                        var items = editor.call('selector:items');
                        if (items.length === 0 || items.length === 1) {
                            const selector = editor.call('selector:type');
                            if (selector === value.type) {
                                if (selector === 'asset') {
                                    if (editor.call('assets:panel:currentFolder') === 'scripts') {
                                        return false;
                                    }
                                    if (!items[0] || items[0].get('type') === 'folder') {
                                        return true;
                                    }

                                } else {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                onSelect: function (value, hasChildren, mouseEvt) {
                    var items = editor.call('selector:items');
                    if (editor.call('selector:type') === 'entity') {
                        editor.call('entities:paste', items[0]);
                    } else if (editor.call('selector:type') === 'asset') {
                        const keepFolderStructure = mouseEvt && mouseEvt.shiftKey;
                        editor.call('assets:paste', items[0], keepFolderStructure);
                    }
                }
            }, {
                text: 'Edit',
                icon: 'E130',
                onIsEnabled: function () {
                    var type = editor.call('selector:type');
                    if (!type || type !== 'asset')
                        return false;

                    var items = editor.call('selector:items');
                    return items.length === 1 && ['html', 'css', 'json', 'text', 'script', 'shader'].indexOf(items[0].get('type')) !== -1;
                },
                onSelect: function () {
                    var type = editor.call('selector:type');
                    if (!type || type !== 'asset') return;
                    var items = editor.call('selector:items');

                    editor.call('assets:edit', items[0]);
                }
            }, {
                text: 'Duplicate',
                icon: 'E126',
                onIsEnabled: function () {
                    if (!editor.call('permissions:write'))
                        return false;

                    var type = editor.call('selector:type');
                    if (!type)
                        return false;

                    var items = editor.call('selector:items');

                    if (type === 'entity') {
                        if (items.indexOf(editor.call('entities:root')) !== -1)
                            return false;

                        return items.length > 0;
                    } else if (type === 'asset') {
                        return items.length === 1 && items[0].get('type') === 'material';
                    }
                    return false;

                },
                onSelect: function () {
                    var type = editor.call('selector:type');
                    if (!type) return;
                    var items = editor.call('selector:items');

                    if (type === 'entity') {
                        editor.call('entities:duplicate', items);
                    } else if (type === 'asset') {
                        editor.call('assets:duplicate', items[0]);
                    }
                }
            }, {
                text: 'Delete',
                icon: 'E124',
                onIsEnabled: function () {
                    if (!editor.call('permissions:write'))
                        return false;

                    var type = editor.call('selector:type');
                    if (!type) return false;

                    if (type === 'entity') {
                        var root = editor.call('entities:root');
                        var items = editor.call('selector:items');
                        for (let i = 0; i < items.length; i++) {
                            if (items[i] === root) {
                                return false;
                            }
                        }
                    }

                    return true;
                },
                onSelect: function () {
                    var type = editor.call('selector:type');
                    if (!type) return;
                    var items = editor.call('selector:items');

                    if (type === 'entity') {
                        var root = editor.call('entities:root');
                        if (items.indexOf(root) !== -1)
                            return;
                        editor.call('entities:delete', items);
                    } else if (type === 'asset') {
                        editor.call('assets:delete:picker', items);
                    }
                }
            }]
        }, {
            text: 'Launch',
            onSelect: function () {
                editor.call('launch');
            },
            items: [{
                text: 'Launch',
                icon: 'E131',
                onSelect: function () {
                    editor.call('launch', 'default');
                }
            }]
        }, {
            text: 'Help',
            items: [{
                text: 'Controls',
                icon: 'E136',
                onSelect: function () {
                    editor.call('help:controls');
                }
            }, {
                text: 'Learn',
                icon: 'E232',
                onSelect: function () {
                    window.open('https://developer.playcanvas.com/');
                }
            }, {
                text: 'Forum',
                icon: 'E233',
                onSelect: function () {
                    window.open('https://forum.playcanvas.com/');
                }
            }, {
                text: 'Log Issue',
                icon: 'E259',
                onSelect: function () {
                    window.open('https://github.com/playcanvas/editor/issues');
                }
            }, {
                text: 'How do I...',
                icon: 'E138',
                onSelect: function () {
                    editor.call('help:howdoi');
                }
            }, {
                text: 'Reset Tips',
                icon: 'E138',
                onSelect: function () {
                    editor.call('editor:tips:reset');
                }
            }]
        }, {
            text: 'Scenes',
            icon: 'E147',
            onSelect: function () {
                editor.call('picker:scene');
            }
        }, {
            text: 'Publishing',
            icon: 'E237',
            onSelect: function () {
                editor.call('picker:builds-publish');
            }
        }, {
            text: 'Version Control',
            icon: 'E399',
            onIsVisible: function () {
                return !config.project.settings.useLegacyScripts && editor.call('permissions:read');
            },
            onSelect: function () {
                editor.call('picker:versioncontrol');
            }
        }, {
            text: 'Bake LightMaps',
            icon: 'E191',
            onSelect: function () {
                editor.call('lightmapper:bake');
                editor.call('entities:shadows:update');
            }
        }, {
            text: 'Code Editor',
            icon: 'E130',
            onIsVisible: function () {
                return !editor.call('settings:project').get('useLegacyScripts');
            },
            onSelect: function () {
                editor.call('picker:codeeditor');
            }
        }, {
            text: 'Settings',
            icon: 'E134',
            onIsEnabled: function () {
                return editor.call('selector:type') !== 'editorSettings' && !editor.call('viewport:expand:state');
            },
            onSelect: function () {
                editor.call('selector:set', 'editorSettings', [editor.call('settings:projectUser')]);
            }
        }, {
            text: 'Script Priority',
            icon: 'E134',
            onIsVisible: () => {
                return legacyScripts;
            },
            onIsEnabled: function () {
                return editor.call('permissions:write');
            },
            onSelect: function () {
                editor.call('sceneSettings:priorityScripts');
            }
        }]
    });
    menu.position(45, 0);
    root.append(menu);

    var tooltip = Tooltip.attach({
        target: logo.element,
        text: 'Menu',
        align: 'left',
        root: root
    });
    menu.on('show', () => {
        tooltip.disabled = true;
    });

    menu.on('hide', () => {
        tooltip.disabled = false;
    });

    logo.on('click', function () {
        menu.hidden = false;
    });
});
