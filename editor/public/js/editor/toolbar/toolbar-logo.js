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
        'animation': '&#57972;',
        'audiolistener': '&#57959;',
        'audiosource': '&#57940;',
        'camera': '&#58756;',
        'collision': '&#58151;',
        'light': '&#58136;',
        'model': '&#58391;',
        'particlesystem': '&#58456;',
        'rigidbody': '&#58152;',
        'script': '&#57988;'
    };

    var newEntity = function (data) {
        data = data || { };

        var parent = null;
        if (editor.call('selector:type') === 'entity')
            parent = editor.call('selector:items')[0];

        return editor.call('entities:new', {
            name: data.name,
            components: data.components,
            parent: parent
        });
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
                return editor.call('permissions:write');
            },
            items: {
                'new-entity': {
                    title: 'New Entity',
                    select: function () {
                        newEntity();
                    },
                    items: {
                        'add-new-entity': {
                            title: 'Entity',
                            icon: '&#58468;',
                            select: function() {
                                newEntity();
                            }
                        },
                        'add-new-listener': {
                            title: 'Audio Listener',
                            icon: componentsLogos.audiolistener,
                            select: function() {
                                newEntity({
                                    name: 'Audio Listener',
                                    components: {
                                        audiolistener: editor.call('components:getDefault', 'audiolistener')
                                    }
                                });
                            }
                        },
                        'add-new-audiosource': {
                            title: 'Audio Source',
                            icon: componentsLogos.audiosource,
                            select: function() {
                                newEntity({
                                    name: 'Audio Source',
                                    components: {
                                        audiosource: editor.call('components:getDefault', 'audiosource')
                                    }
                                });
                            }
                        },
                        'add-new-camera': {
                            title: 'Camera',
                            icon: componentsLogos.camera,
                            select: function() {
                                newEntity({
                                    name: 'Camera',
                                    components: {
                                        camera: editor.call('components:getDefault', 'camera')
                                    }
                                });
                            }
                        },
                        'add-new-box': {
                            title: 'Box',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'box';

                                newEntity({
                                    name: 'Box',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-capsule': {
                            title: 'Capsule',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'capsule';

                                newEntity({
                                    name: 'Capsule',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-cone': {
                            title: 'Cone',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'cone';

                                newEntity({
                                    name: 'Cone',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-cylinder': {
                            title: 'Cylinder',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'cylinder';

                                newEntity({
                                    name: 'Cylinder',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-model': {
                            title: 'Model',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'asset';

                                newEntity({
                                    name: 'Model',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-plane': {
                            title: 'Plane',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'plane';

                                newEntity({
                                    name: 'Plane',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-sphere': {
                            title: 'Sphere',
                            icon: componentsLogos.model,
                            select: function() {
                                var component = editor.call('components:getDefault', 'model');
                                component.type = 'sphere';

                                newEntity({
                                    name: 'Sphere',
                                    components: {
                                        model: component
                                    }
                                });
                            }
                        },
                        'add-new-directional': {
                            title: 'Directional Light',
                            icon: componentsLogos.light,
                            select: function() {
                                var component = editor.call('components:getDefault', 'light');
                                component.type = 'directional';

                                newEntity({
                                    name: 'Directional Light',
                                    components: {
                                        light: component
                                    }
                                });
                            }
                        },
                        'add-new-point': {
                            title: 'Point Light',
                            icon: componentsLogos.light,
                            select: function() {
                                var component = editor.call('components:getDefault', 'light');
                                component.type = 'point';
                                component.shadowResolution = 256;

                                newEntity({
                                    name: 'Point Light',
                                    components: {
                                        light: component
                                    }
                                });
                            }
                        },
                        'add-new-spot': {
                            title: 'Spot Light',
                            icon: componentsLogos.light,
                            select: function() {
                                var component = editor.call('components:getDefault', 'light');
                                component.type = 'spot';

                                newEntity({
                                    name: 'Spot Light',
                                    components: {
                                        light: component
                                    }
                                });
                            }
                        },
                        'add-new-particles': {
                            title: 'Particle System',
                            icon: componentsLogos.particlesystem,
                            select: function() {
                                newEntity({
                                    name: 'Particle System',
                                    components: {
                                        particlesystem: editor.call('components:getDefault', 'particlesystem')
                                    }
                                });
                            }
                        }

                    }
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
                    icon: '&#57654;',
                    filter: function() {
                        return editor.call('history:canUndo');
                    },
                    select: function() {
                        editor.call('history:undo');
                    }
                },
                'redo': {
                    title: 'Redo',
                    icon: '&#57655;',
                    filter: function() {
                        return editor.call('history:canRedo');
                    },
                    select: function() {
                        editor.call('history:redo');
                    }
                },
                'enable': {
                    title: 'Enable',
                    icon: '&#58421;',
                    filter: function() {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity';
                    },
                    hide: function () {
                        var type = editor.call('selector:type');
                        if (type === 'entity') {
                            var items = editor.call('selector:items');
                            return items[0].get('enabled');
                        }

                        return true;
                    },
                    select: function() {
                        var items = editor.call('selector:items');
                        items[0].set('enabled', true);
                    }
                },
                'disable': {
                    title: 'Disable',
                    icon: '&#58422;',
                    filter: function() {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity';
                    },
                    hide: function () {
                        var type = editor.call('selector:type');
                        if (type === 'entity') {
                            var items = editor.call('selector:items');
                            return !items[0].get('enabled');
                        }

                        return true;
                    },
                    select: function() {
                        var items = editor.call('selector:items');
                        items[0].set('enabled', false);
                    }
                },
                'copy': {
                    title: 'Copy',
                    icon: '&#57891;',
                    filter: function () {
                        if (! editor.call('permissions:write'))
                            return false;

                        return editor.call('selector:type') === 'entity';
                    },
                    hide: function () {
                        return !this.filter();
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
                               !editor.call('entities:clipboard:empty') &&
                               editor.call('entities:clipboard:get').project === config.project.id;
                    },
                    hide: function () {
                        return editor.call('selector:type') !== 'entity';
                    },
                    select: function () {
                        var items = editor.call('selector:items');
                        editor.call('entities:paste', items[0]);
                    }
                },
                'duplicate': {
                    title: 'Duplicate',
                    icon: '&#57908;',
                    filter: function() {
                        return editor.call('permissions:write') && editor.call('selector:type') === 'entity';
                    },
                    select: function() {
                        var type = editor.call('selector:type');
                        if (! type) return;
                        var items = editor.call('selector:items');

                        if (type === 'entity') {
                            editor.call('entities:duplicate', items[0]);
                        } else if (type === 'asset') {
                            // TODO
                            // duplicate asset
                        }
                    }
                },
                'delete': {
                    title: 'Delete',
                    icon: '&#58657;',
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
                            for(var i = 0; i < items.length; i++)
                                editor.call('entities:delete', items[i]);
                        } else if (type === 'asset') {
                            editor.call('picker:confirm', 'Delete Asset?', function() {
                                for(var i = 0; i < items.length; i++)
                                    editor.call('assets:delete', items[i]);
                            });
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
                    icon: '&#57922;',
                    select: function() {
                        var url = window.location.href.replace(/^https/, 'http') + '/launch';
                        window.open(url, 'pc.launch.' + config.scene.id);
                    }
                },
                'launch-local': {
                    title: 'Launch (Local)',
                    icon: '&#57922;',
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
                    icon: '&#57976;',
                    select: function() {
                        editor.call('help:controls');
                    }
                },
                'reference': {
                    title: 'Reference',
                    icon: '&#57890;',
                    select: function() {
                        window.open('http://developer.playcanvas.com/en/engine/api/stable/');
                    }
                },
                'learn': {
                    title: 'Learn',
                    icon: '&#57890;',
                    select: function() {
                        window.open('http://developer.playcanvas.com/en/');
                    }
                },
                'forum': {
                    title: 'Forum',
                    icon: '&#58488;',
                    select: function() {
                        window.open('http://forum.playcanvas.com/');
                    }
                },
                'answers': {
                    title: 'Answers',
                    icon: '?',
                    select: function() {
                        window.open('http://answers.playcanvas.com/');
                    }
                }
            }
        },
        'settings': {
            title: 'Settings',
            icon: '&#58152;',
            filter: function() {
                return editor.call('permissions:write') && editor.call('selector:type') !== 'designerSettings' && ! editor.call('viewport:expand:state');
            },
            select: function() {
                editor.call('selector:set', 'designerSettings', [ editor.call('designerSettings') ]);
            }
        },
        'feedback': {
            title: 'Feedback',
            icon: '&#58488;',
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
