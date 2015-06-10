editor.once('load', function() {
    'use strict';

    var entity = null;
    var items = [ ];
    var root = editor.call('layout.root');

    // create data for entity menu
    var menu;

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

    var getSelection = function() {
        var selection = editor.call('selector:items');

        if (selection.indexOf(entity) !== -1) {
            return selection;
        } else {
            return [ entity ];
        }
    };

    var newEntity = function (data) {
        data = data || { };

        var parent = items[0];

        var entity = editor.call('entities:new', {
            name: data.name,
            components: data.components,
            parent: parent
        });

        editor.call('selector:history', false);
        editor.call('selector:set', 'entity', [ entity ]);
        editor.once('selector:change', function() {
            editor.call('selector:history', true);
        });

        return entity;
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
        };

        menuData['add-component'] = {
            title: 'Add Component',
            filter: function() {
                return items.length === 1;
            },
            items: { }
        };

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

        var makeMenuComponentItem = function(key) {
            return {
                title: components[key].title,
                icon: componentsLogos[key],
                filter: function() {
                    if (items.length !== 1)
                        return false;

                    return ! items[0].has('components.' + key);
                },
                select: function() {
                    if (items.length !== 1)
                        return false;

                    var entity = items[0];
                    var component = this._value;

                    addComponent(entity, component);
                }
            }
        };

        var components = editor.call('components:schema');
        var list = editor.call('components:list');
        for(var i = 0; i < list.length; i++) {
            var key = list[i];
            menuData['add-component'].items[key] = makeMenuComponentItem(key);
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
            menuData['add-builtin-script'].items[data.group].items[data.name] = {
                title: data.title,
                filter: function () {
                    return items.length === 1 &&
                           editor.call('permissions:write') &&
                           !hasScript(items[0], data.url) &&
                           (!data.requires || items[0].get('components.' + data.requires));
                },
                select: function () {
                    addBultinScript(items[0], data.url);
                }
            };
        });

        // menu
        menu = ui.Menu.fromData(menuData);
        root.append(menu);
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
