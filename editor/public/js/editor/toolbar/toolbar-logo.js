editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');


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
        'rigidbody': '&#57744;',
        'script': '&#57910;'
    };

    var addComponent = function (entity, component) {
        var componentData = editor.call('components:getDefault', component);
        entity.set('components.' + component, componentData);

        // if it's a collision or rigidbody component then enable physics
        if (component === 'collision' || component === 'rigidbody')
            editor.call('project:enablePhysics');
    };

    var hasScript = function (entity, url) {
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

    var addBultinScript = function (entity, url) {
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
                    addComponent(e, 'script');
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
                if (editor.call('selector:type') === 'entity' && editor.call('selector:items').length !== 1)
                    return false;

                return editor.call('permissions:write');
            },
            items: {
                'new-entity': {
                    title: 'New Entity',
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
                    items: { }
                },
                'add-builtin-script': {
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
                }
            }
        },
        'edit': {
            title: 'Edit',
            items: {
                'undo': {
                    title: 'Undo',
                    icon: '&#57620;',
                    filter: function() {
                        return editor.call('history:canUndo');
                    },
                    select: function() {
                        editor.call('history:undo');
                    }
                },
                'redo': {
                    title: 'Redo',
                    icon: '&#57621;',
                    filter: function() {
                        return editor.call('history:canRedo');
                    },
                    select: function() {
                        editor.call('history:redo');
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
                    icon: '&#57891;',
                    filter: function () {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity' && editor.call('selector:items').length === 1;
                    },
                    select: function () {
                        var items = editor.call('selector:items');
                        editor.call('entities:copy', items[0]);
                    }
                },
                'paste': {
                    title: 'Paste',
                    icon: '&#57892;',
                    filter: function () {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity' &&
                               editor.call('selector:items').length === 1 &&
                             ! editor.call('entities:clipboard:empty') &&
                               editor.call('entities:clipboard:get').project === config.project.id;
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
                        return items.length === 1 &&
                               ['html', 'css', 'json', 'text', 'script', 'shader'].indexOf(items[0].get('type')) !== -1;
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
                            return items.length === 1;
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
                            editor.call('entities:duplicate', items[0]);
                        } else if (type === 'asset') {
                            editor.call('assets:duplicate', items[0]);
                        }
                    }
                },
                'delete': {
                    title: 'Delete',
                    icon: '&#57637;',
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
                var url = window.location.href.replace(/^https/, 'http') + '/launch';
                window.open(url, 'pc.launch.' + config.scene.id);
            },
            items: {
                'launch-remote': {
                    title: 'Launch',
                    icon: '&#57649;',
                    select: function() {
                        var url = window.location.href.replace(/^https/, 'http') + '/launch';
                        window.open(url, 'pc.launch.' + config.scene.id);
                    }
                },
                'launch-local': {
                    title: 'Launch (Local)',
                    icon: '&#57649;',
                    filter: function() {
                        return editor.call('permissions:write');
                    },
                    select: function() {
                        var settings = editor.call('designerSettings');
                        var url = window.location.href.replace(/^https/, 'http') + '/launch?local=' + settings.get('local_server');
                        window.open(url, 'pc.launch.' + config.scene.id);
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
                'reference': {
                    title: 'Reference',
                    icon: '&#57906;',
                    select: function() {
                        window.open('http://developer.playcanvas.com/en/engine/api/stable/');
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
                'answers': {
                    title: 'Answers',
                    icon: '&#57656;',
                    select: function() {
                        window.open('http://answers.playcanvas.com/');
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
        'settings': {
            title: 'Settings',
            icon: '&#57652;',
            filter: function() {
                return editor.call('permissions:write') && editor.call('selector:type') !== 'designerSettings' && ! editor.call('viewport:expand:state');
            },
            select: function() {
                editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
            }
        },
        'priorityScripts': {
            title: 'Script Priority',
            icon: '&#57652;',
            filter: function() {
                return editor.call('permissions:write');
            },
            select: function() {
                editor.call('sceneSettings:priorityScripts');
            }
        },
        'feedback': {
            title: 'Feedback',
            icon: '&#57625;',
            select: function() {
                window.open('http://forum.playcanvas.com/t/playcanvas-editor-feedback/616');
            }
        }
    };

    var makeMenuComponentItem = function(key) {
        return {
            title: components[key].title,
            icon: componentsLogos[key],
            filter: function() {
                if (editor.call('selector:type') !== 'entity')
                    return false;

                var entity = editor.call('selector:items')[0];
                return ! entity.has('components.' + key);
            },
            select: function() {
                if (editor.call('selector:type') !== 'entity')
                    return;

                var entity = editor.call('selector:items')[0];
                var component = this._value;

                addComponent(entity, component);
            }
        }
    };

    var components = editor.call('components:schema');
    var list = editor.call('components:list');
    for(var i = 0; i < list.length; i++) {
        var key = list[i];
        menuData['entity'].items['add-component'].items[key] = makeMenuComponentItem(key);
    }

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
                       !hasScript(entity, data.url) &&
                       (!data.requires || entity.get('components.' + data.requires));
            },
            select: function () {
                var entity = editor.call('selector:items')[0];
                addBultinScript(entity, data.url);
            }
        };
    });

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
