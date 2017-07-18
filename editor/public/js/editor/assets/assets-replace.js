editor.once('load', function() {
    'use strict';

    var slots = [ 'aoMap', 'diffuseMap', 'emissiveMap', 'glossMap', 'lightMap', 'metalnessMap', 'opacityMap', 'specularMap', 'normalMap', 'sphereMap' ];

    editor.method('assets:replace', function(asset, replacement) {
        var id = parseInt(asset.get('id'), 10);
        var idNew = parseInt(replacement.get('id'), 10);

        var entities = editor.call('entities:list');
        var assets = editor.call('assets:list');

        var records = [ ];

        // TODO
        // history

        var set = function(obj, path) {
            var history = obj.history.enabled;
            obj.history.enabled = false;
            obj.set(path, idNew);
            obj.history.enabled = history;

            if (history) {
                records.push({
                    get: obj.history._getItemFn,
                    path: path
                });
            }
        };

        switch(asset.get('type')) {
            case 'material':
                // entity
                for(var i = 0; i < entities.length; i++) {
                    var obj = entities[i];

                    // model
                    var model = obj.get('components.model');
                    if (model) {
                        if (model.materialAsset === id) {
                            // components.model.materialAsset
                            set(obj, 'components.model.materialAsset');
                        }
                        if (model.mapping) {
                            for(var ind in model.mapping) {
                                if (model.mapping[ind] === id) {
                                    // components.model.mapping.?
                                    set(obj, 'components.model.mapping.' + ind);
                                }
                            }
                        }
                    }

                    // element
                    var element = obj.get('components.element');
                    if (element && element.materialAsset === id) {
                        // components.element.materialAsset
                        set(obj, 'components.element.materialAsset');
                    }
                }

                // asset
                for(var i = 0; i < assets.length; i++) {
                    var obj = assets[i];

                    if (obj.get('type') === 'model') {
                        var mapping = obj.get('data.mapping');
                        if (mapping) {
                            for(var ind = 0; ind < mapping.length; ind++) {
                                if (mapping[ind].material !== id)
                                    continue;

                                // data.mapping.?.material
                                set(obj, 'data.mapping.' + ind + '.material');

                                // change meta.userMapping as well
                                var history = obj.history.enabled;
                                obj.history.enabled = false;
                                if (! obj.get('meta')) {
                                    obj.set('meta', {
                                        userMapping: {}
                                    });
                                } else {
                                    if (! obj.has('meta.userMapping'))
                                        obj.set('meta.userMapping', {});
                                }

                                obj.set('meta.userMapping.' + ind, true);

                                obj.history.enabled = history;
                            }
                        }
                    }
                }
                break;

            case 'texture':
                // entity
                for(var i = 0; i < entities.length; i++) {
                    var obj = entities[i];

                    // light
                    var light = obj.get('components.light');
                    if (light && light.cookieAsset === id) {
                        // components.light.cookieAsset
                        set(obj, 'components.light.cookieAsset');
                    }

                    // particlesystem
                    var particlesystem = obj.get('components.particlesystem');
                    if (particlesystem) {
                        if (particlesystem.colorMapAsset === id) {
                            // components.particlesystem.colorMapAsset
                            set(obj, 'components.particlesystem.colorMapAsset');
                        }
                        if (particlesystem.normalMapAsset === id) {
                            // components.particlesystem.normalMapAsset
                            set(obj, 'components.particlesystem.normalMapAsset');
                        }
                    }

                    // element
                    var element = obj.get('components.element');
                    if (element && element.textureAsset === id) {
                        // components.element.textureAsset
                        set(obj, 'components.element.textureAsset');
                    }
                }

                // asset
                for(var i = 0; i < assets.length; i++) {
                    var obj = assets[i];

                    if (obj.get('type') === 'cubemap') {
                        var textures = obj.get('data.textures');
                        if (textures && textures instanceof Array) {
                            for(var ind = 0; ind < textures.length; ind++) {
                                if (textures[ind] !== id)
                                    continue;

                                // data.mapping.?.material
                                set(obj, 'data.textures.' + ind);
                            }
                        }
                    } else if (obj.get('type') === 'material') {
                        var data = obj.get('data');
                        if (data) {
                            for(var s = 0; s < slots.length; s++) {
                                if (data[slots[s]] !== id)
                                    continue;

                                set(obj, 'data.' + slots[s]);
                            }
                        }
                    }
                }
                break;

            case 'model':
                // entity
                for(var i = 0; i < entities.length; i++) {
                    var obj = entities[i];

                    // model
                    var model = obj.get('components.model');
                    if (model && model.asset === id) {
                        // components.model.asset
                        set(obj, 'components.model.asset');
                    }

                    // collision
                    var collision = obj.get('components.collision');
                    if (collision && collision.asset === id) {
                        // components.collision.asset
                        set(obj, 'components.collision.asset');
                    }

                    // particlesystem
                    var particlesystem = obj.get('components.particlesystem');
                    if (particlesystem && particlesystem.mesh === id) {
                        // components.particlesystem.mesh
                        set(obj, 'components.particlesystem.mesh');
                    }
                }
                break;

            case 'animation':
                // entity
                for(var i = 0; i < entities.length; i++) {
                    var obj = entities[i];

                    // animation
                    var animation = obj.get('components.animation');
                    if (animation && animation.assets) {
                        for(ind = 0; ind < animation.assets.length; ind++) {
                            if (animation.assets[ind] !== id)
                                continue;

                            // components.animation.assets.?
                            set(obj, 'components.animation.assets.' + ind);
                        }
                    }
                }
                break;

            case 'audio':
                // entity
                for(var i = 0; i < entities.length; i++) {
                    var obj = entities[i];

                    // sound
                    var sound = obj.get('components.sound');
                    if (sound) {
                        for(var ind in sound.slots) {
                            if (! sound.slots[ind] || sound.slots[ind].asset !== id)
                                continue;

                            // components.sound.slots.?.asset
                            set(obj, 'components.sound.slots.' + ind + '.asset');
                        }
                    }

                    // audiosource
                    var audiosource = obj.get('components.audiosource');
                    if (audiosource && audiosource.assets) {
                        for(var a = 0; a < audiosource.assets.length; a++) {
                            if (audiosource.assets[a] !== id)
                                continue;

                            // components.audiosource.assets.?
                            set(obj, 'components.audiosource.assets.' + a);
                        }
                    }
                }
                break;

            case 'cubemap':
                // entity
                for(var i = 0; i < entities.length; i++) {
                    var obj = entities[i];

                    // light
                    var light = obj.get('components.light');
                    if (light && light.cookieAsset === id) {
                        // components.light.cookieAsset
                        set(obj, 'components.light.cookieAsset');
                    }
                }

                // asset
                for(var i = 0; i < assets.length; i++) {
                    var obj = assets[i];

                    if (obj.get('type') === 'material' && obj.get('data.cubeMap') === id) {
                        // data.cubeMap
                        set(obj, 'data.cubeMap');
                    }
                }

                // sceneSettings
                var obj = editor.call('sceneSettings');
                if (obj.get('render.skybox') === id) {
                    // render.skybox
                    set(obj, 'render.skybox');
                }
                break;
        }

        // entity.components.script
        for(var i = 0; i < entities.length; i++) {
            var obj = entities[i];

            // script
            var scripts = obj.get('components.script.scripts');
            if (scripts) {
                for (var script in scripts) {
                    var assetScript = editor.call('assets:scripts:assetByScript', script);
                    if (! assetScript)
                        continue;

                    var assetScripts = assetScript.get('data.scripts');
                    if (! assetScripts || ! assetScripts[script] || ! assetScripts[script].attributes)
                        continue;

                    var attributes = assetScripts[script].attributes;

                    for(var attrName in scripts[script].attributes) {
                        if (scripts[script].attributes[attrName] !== id)
                            continue;

                        if (! attributes[attrName] || attributes[attrName].type !== 'asset')
                            continue;

                        // components.script.scripts.?.attributes.?
                        set(obj, 'components.script.scripts.' + script + '.attributes.' + attrName);
                    }
                }
            }
        }

        if (records.length) {
            editor.call('history:add', {
                name: 'asset replace',
                undo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var obj = records[i].get();
                        if (! obj || ! obj.has(records[i].path))
                            continue;

                        var history = asset.history.enabled;
                        obj.history.enabled = false;

                        obj.set(records[i].path, id);

                        // if we changed data.mapping also change meta.userMapping
                        if (/^data.mapping/.test(records[i].path)) {
                            if (obj.has('meta.userMapping')) {
                                var parts = records[i].path.split('.');
                                obj.unset('meta.userMapping.' + parts[2], true);
                                if (Object.keys(obj.get('meta.userMapping')).length === 0)
                                    obj.unset('meta.userMapping');
                            }
                        }

                        obj.history.enabled = history;
                    }
                },
                redo: function() {
                    for(var i = 0; i < records.length; i++) {
                        var obj = records[i].get();
                        if (! obj || ! obj.has(records[i].path))
                            continue;

                        var history = asset.history.enabled;
                        obj.history.enabled = false;
                        obj.set(records[i].path, idNew);

                        // if we changed data.mapping also change meta.userMapping
                        if (/^data.mapping/.test(records[i].path)) {
                            if (! obj.get('meta')) {
                                obj.set('meta', {
                                    userMapping: {}
                                });
                            } else {
                                if (! obj.has('meta.userMapping'))
                                    obj.set('meta.userMapping', {});
                            }


                            var parts = records[i].path.split('.');
                            obj.set('meta.userMapping.' + parts[2], true);
                        }

                        obj.history.enabled = history;
                    }
                }
            });
        }
    });
});
