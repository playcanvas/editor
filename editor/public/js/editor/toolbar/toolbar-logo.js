editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');
    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');

    var history = editor.call('editor:history');


    var logo = new ui.Button();
    logo.class.add('logo');
    logo.on('click', function() {
        menu.open = true;
    });
    toolbar.append(logo);

    var componentsLogos = {
        'animation': '&#57875;',
        'audiolistener': '&#57750;',
        'audiosource': '&#57751;',
        'camera': '&#57874;',
        'collision': '&#57735;',
        'light': '&#57748;',
        'model': '&#57736;',
        'particlesystem': '&#57753;',
        'rigidbody': '&#57737;',
        'script': '&#57910;'
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

    var setField = function(items, field, value) {
        var records = [ ];

        for(var i = 0; i < items.length; i++) {
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
                for (var i = 0; i < records.length; i++) {
                    var item = records[i].item.latest();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set(field, records[i].valueOld);
                    item.history.enabled = true;
                }
            },
            redo: function () {
                for (var i = 0; i < records.length; i++) {
                    var item = records[i].item.latest();
                    if (! item)
                        continue;

                    item.history.enabled = false;
                    item.set(field, records[i].value);
                    item.history.enabled = true;
                }
            }
        });
    };

    var addBultinLegacyScript = function (entity, url) {
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

    var menuData = {
        'entity': {
            title: 'Entity',
            filter: function() {
                return editor.call('selector:type') === 'entity' && editor.call('permissions:write');
            },
            items: {
                'new-entity': {
                    title: 'New Entity',
                    filter: function () {
                        return editor.call('selector:items').length === 1;
                    },
                    select: function () {
                        editor.call('entities:new', {parent: editor.call('entities:selectedFirst')});
                    },
                    items: editor.call('menu:entities:new')
                },
                'add-component': {
                    title: 'Add Component',
                    filter: function() {
                        return editor.call('selector:type') === 'entity';
                    },
                    items: editor.call('menu:entities:add-component')
                }
            }
        },
        'edit': {
            title: 'Edit',
            filter: function() {
                return editor.call('permissions:write');
            },
            items: {
                'undo': {
                    title: 'Undo',
                    icon: '&#57620;',
                    filter: function() {
                        return history.canUndo;
                    },
                    select: function() {
                        return history.undo();
                    }
                },
                'redo': {
                    title: 'Redo',
                    icon: '&#57621;',
                    filter: function() {
                        return history.canRedo;
                    },
                    select: function() {
                        history.redo();
                    }
                },
                'enable': {
                    title: 'Enable',
                    icon: '&#57651;',
                    filter: function() {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity';
                    },
                    hide: function () {
                        var type = editor.call('selector:type');
                        if (type !== 'entity')
                            return true;

                        var items = editor.call('selector:items');

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
                        setField(editor.call('selector:items'), 'enabled', true);
                    }
                },
                'disable': {
                    title: 'Disable',
                    icon: '&#57650;',
                    filter: function() {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity';
                    },
                    hide: function () {
                        var type = editor.call('selector:type');
                        if (type !== 'entity')
                            return true;

                        var items = editor.call('selector:items');

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
                        setField(editor.call('selector:items'), 'enabled', false);
                    }
                },
                'copy': {
                    title: 'Copy',
                    icon: '&#58193;',
                    filter: function () {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity' && editor.call('selector:items').length;
                    },
                    select: function () {
                        var items = editor.call('selector:items');
                        editor.call('entities:copy', items);
                    }
                },
                'paste': {
                    title: 'Paste',
                    icon: '&#58184;',
                    filter: function () {
                        if (! editor.call('permissions:write'))
                            return false;

                        if (! editor.call('entities:clipboard:empty')) {
                            var items = editor.call('selector:items');
                            if (items.length === 0 || items.length === 1 && editor.call('selector:type') === 'entity') {
                                return true;
                            }
                        }

                        return false;
                    },
                    select: function () {
                        var items = editor.call('selector:items');
                        editor.call('entities:paste', items[0]);
                    }
                },
                'edit': {
                    title: 'Edit',
                    icon: '&#57648;',
                    filter: function() {
                        var type = editor.call('selector:type');
                        if (! type || type !== 'asset')
                            return false;

                        var items = editor.call('selector:items');
                        return items.length === 1 && ['html', 'css', 'json', 'text', 'script', 'shader'].indexOf(items[0].get('type')) !== -1;
                    },
                    select: function() {
                        var type = editor.call('selector:type');
                        if (! type || type !== 'asset') return;
                        var items = editor.call('selector:items');

                        editor.call('assets:edit', items[0]);
                    }
                },
                'duplicate': {
                    title: 'Duplicate',
                    icon: '&#57638;',
                    filter: function() {
                        if (! editor.call('permissions:write'))
                            return false;

                        var type = editor.call('selector:type');
                        if (! type)
                            return false;

                        var items = editor.call('selector:items');

                        if (type === 'entity') {
                            if (items.indexOf(editor.call('entities:root')) !== -1)
                                return false;

                            return items.length > 0;
                        } else if (type === 'asset') {
                            return items.length === 1 && items[0].get('type') === 'material';
                        } else {
                            return false;
                        }
                    },
                    select: function() {
                        var type = editor.call('selector:type');
                        if (! type) return;
                        var items = editor.call('selector:items');

                        if (type === 'entity') {
                            editor.call('entities:duplicate', items);
                        } else if (type === 'asset') {
                            editor.call('assets:duplicate', items[0]);
                        }
                    }
                },
                'delete': {
                    title: 'Delete',
                    icon: '&#57636;',
                    filter: function() {
                        if (! editor.call('permissions:write'))
                            return false;

                        var type = editor.call('selector:type');
                        if (!type) return false;

                        if (type === 'entity') {
                            var root = editor.call('entities:root');
                            var items = editor.call('selector:items');
                            for (var i = 0; i < items.length; i++) {
                                if (items[i] === root) {
                                    return false;
                                }
                            }
                        }

                        return true;
                    },
                    select: function() {
                        var type = editor.call('selector:type');
                        if (! type) return;
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
                }
            }
        },
        'launch': {
            title: 'Launch',
            select: function() {
                editor.call('launch');
            },
            items: {
                'launch-remote': {
                    title: 'Launch',
                    icon: '&#57649;',
                    select: function() {
                        editor.call('launch', 'default');
                    }
                }
            }
        },
        'help': {
            title: 'Help',
            items: {
                'controls': {
                    title: 'Controls',
                    icon: '&#57654;',
                    select: function() {
                        editor.call('help:controls');
                    }
                },
                'learn': {
                    title: 'Learn',
                    icon: '&#57906;',
                    select: function() {
                        window.open('http://developer.playcanvas.com/en/');
                    }
                },
                'forum': {
                    title: 'Forum',
                    icon: '&#57907;',
                    select: function() {
                        window.open('http://forum.playcanvas.com/');
                    }
                },
                'issue': {
                    title: 'Log Issue',
                    icon: '&#57945;',
                    select: function() {
                        window.open('https://github.com/playcanvas/editor');
                    }
                },
                'howdoi': {
                    title: 'How do I...',
                    icon: '&#57656;',
                    select: function () {
                        editor.call('help:howdoi');
                    }
                },
                'resetTips': {
                    title: 'Reset Tips',
                    icon: '&#57656;',
                    select: function () {
                        editor.call('editor:tips:reset');
                    }
                }
            }
        },
        'scenes': {
            title: 'Scenes',
            icon: '&#57671;',
            select: function() {
                editor.call('picker:scene');
            }
        },
        'publishing': {
            title: 'Publishing',
            icon: '&#57911;',
            select: function() {
                editor.call('picker:publish');
            }
        },
        'version-control': {
            title: 'Version Control',
            icon: '&#58265;',
            hide: function () {
                return config.project.settings.useLegacyScripts || ! editor.call('permissions:read');
            },
            select: function() {
                editor.call('picker:versioncontrol');
            }
        },
        'bake': {
            title: 'Bake LightMaps',
            icon: '&#57745;',
            select: function() {
                editor.call('lightmapper:bake');
                editor.call('entities:shadows:update');
            }
        },
        'code-editor': {
            title: 'Code Editor',
            icon: '&#57648;',
            hide: function () {
                return editor.call('settings:project').get('useLegacyScripts');
            },
            select: function () {
                editor.call('picker:codeeditor');
            }
        },
        'settings': {
            title: 'Settings',
            icon: '&#57652;',
            filter: function() {
                return editor.call('selector:type') !== 'editorSettings' && ! editor.call('viewport:expand:state');
            },
            select: function() {
                editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
            }
        }
    };

    if (editor.call('users:hasFlag', 'hasTemplates') && !legacyScripts) {
        menuData.entity.items.template = {
            title: 'Template',
            filter: () => {
                return editor.call('selector:type') === 'entity' &&
                       editor.call('selector:items').length === 1;
            },
            items: editor.call('menu:entities:template')
        };
    }

    if (legacyScripts) {
        menuData['entity']['items']['add-builtin-script'] = {
            title: 'Add Built-In Script',
            filter: function () {
                return editor.call('selector:type') === 'entity';
            },
            items: {
                'post-effects': {
                    title: 'Post-Effects',
                    filter: function () {
                        return editor.call('selector:type') === 'entity';
                    },
                    items: {}
                },
                'camera-scripts': {
                    title: 'Camera',
                    filter: function () {
                        return editor.call('selector:type') === 'entity';
                    },
                    items: {}
                }
            }
        };

        menuData['priorityScripts'] = {
            title: 'Script Priority',
            icon: '&#57652;',
            filter: function() {
                return editor.call('permissions:write');
            },
            select: function() {
                editor.call('sceneSettings:priorityScripts');
            }
        };
    } else {
        // TODO scripts2
        // add built-in-scripts for new system

        menuData['priorityScripts'] = {
            title: 'Scripts Loading Order',
            icon: '&#57652;',
            filter: function() {
                return editor.call('permissions:write');
            },
            select: function() {
                editor.call('selector:set', 'editorSettings', [ editor.call('settings:projectUser') ]);
                setTimeout(function() {
                    editor.call('editorSettings:panel:unfold', 'scripts-order');
                }, 0);
            }
        };
    }

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
            menuData['entity'].items['add-builtin-script'].items[data.group].items[data.name] = {
                title: data.title,
                filter: function () {
                    var entity = editor.call('selector:items')[0];

                    return editor.call('selector:type') === 'entity' &&
                           editor.call('permissions:write') &&
                           !hasLegacyScript(entity, data.url) &&
                           (!data.requires || entity.get('components.' + data.requires));
                },
                select: function () {
                    var entity = editor.call('selector:items')[0];
                    addBultinLegacyScript(entity, data.url);
                }
            };
        });
    }

    var root = editor.call('layout.root');

    var menu = ui.Menu.fromData(menuData);
    menu.position(45, 0);
    root.append(menu);

    var tooltip = Tooltip.attach({
        target: logo.element,
        text: 'Menu',
        align: 'left',
        root: root
    });
    menu.on('open', function(state) {
        tooltip.disabled = state;
    });

    // get part of menu data
    editor.method('menu:get', function (name) {
        return menuData[name];
    });
});
