editor.once('load', function() {
    'use strict';

    var legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    var index = { };
    var keys = {
        'cubemap': {
            'data.textures.0': true,
            'data.textures.1': true,
            'data.textures.2': true,
            'data.textures.3': true,
            'data.textures.4': true,
            'data.textures.5': true
        },
        'material': {
            'data.aoMap': true,
            'data.diffuseMap': true,
            'data.specularMap': true,
            'data.metalnessMap': true,
            'data.glossMap': true,
            'data.emissiveMap': true,
            'data.opacityMap': true,
            'data.normalMap': true,
            'data.heightMap': true,
            'data.sphereMap': true,
            'data.cubeMap': true,
            'data.lightMap': true
        },
        'sprite': {
            'data.textureAtlasAsset': true
        },
        'model': { },
        'entity': {
            'components.model.materialAsset': true,
            'components.model.asset': true,
            'components.collision.asset': true,
            'components.particlesystem.colorMapAsset': true,
            'components.particlesystem.normalMapAsset': true,
            'components.particlesystem.mesh': true,
            'components.element.textureAsset': true,
            'components.element.spriteAsset': true,
            'components.element.materialAsset': true,
            'components.element.fontAsset': true,
            'components.light.cookieAsset': true,
            'components.sprite.spriteAsset': true
        },
        'entity-lists': {
            'components.animation.assets': true,
            'components.audiosource.assets': true,
            // 'components.script.scripts': true
        }
    };
    var updateAsset = function(referer, type, oldId, newId) {
        if (oldId && index[oldId] !== undefined) {
            index[oldId].count--;

            if (index[oldId].ref[referer]) {
                if (editor.call('assets:used:get', referer)) {
                    index[oldId].parent--;
                    if (index[oldId].count !== 0 && index[oldId].parent === 0)
                        editor.emit('assets:used:' + oldId, false);
                }

                index[oldId].ref[referer][0].unbind();
                if (index[oldId].ref[referer][1])
                    index[oldId].ref[referer][1].unbind();

                delete index[oldId].ref[referer];
            }

            if (index[oldId].count === 0)
                editor.emit('assets:used:' + oldId, false);
        }

        if (newId) {
            if (index[newId] === undefined) {
                index[newId] = {
                    count: 0,
                    parent: 0,
                    ref: { }
                };
            }

            index[newId].count++;

            if (! index[newId].ref[referer]) {
                index[newId].ref[referer] = [ ];
                index[newId].ref[referer].type = type;

                index[newId].ref[referer][0] = editor.on('assets:used:' + referer, function(state) {
                    if (! index[newId])
                        return;

                    index[newId].parent += state * 2 - 1;

                    if (index[newId].parent === 0) {
                        // now not used
                        editor.emit('assets:used:' + newId, false);
                    } else if (index[newId].parent === 1) {
                        // now used
                        editor.emit('assets:used:' + newId, true);
                    }
                });

                // referer can be destroyed
                var itemType = 'asset';
                var item = editor.call('assets:get', referer);
                if (! item) {
                    item = editor.call('entities:get', referer);
                    itemType = 'entity';
                }

                if (item) {
                    index[newId].ref[referer][1] = item.once('destroy', function() {
                        updateAsset(referer, itemType, newId);
                    });
                }

                if (editor.call('assets:used:get', referer)) {
                    index[newId].parent++;

                    if (index[newId].count !== 1 && index[newId].parent === 1)
                        editor.emit('assets:used:' + newId, true);
                }
            }

            if (index[newId].count === 1 && index[newId].parent)
                editor.emit('assets:used:' + newId, true);
        }
    };
    var onSetMethods = {
        'cubemap': function(path, value, valueOld) {
            if (! keys['cubemap'][path])
                return;

            updateAsset(this.get('id'), 'asset', valueOld, value);
        },
        'material': function(path, value, valueOld) {
            if (! keys['material'][path])
                return;

            updateAsset(this.get('id'), 'asset', valueOld, value);
        },
        'model': function(path, value, valueOld) {
            if (path.startsWith('data.mapping.') && path.slice(-8) === 'material')
                updateAsset(this.get('id'), 'asset', valueOld, value);

            if (! keys['model'][path])
                return;

            updateAsset(this.get('id'), 'asset', valueOld, value);
        },
        'model-insert': function(path, value) {
            if (! path.startsWith('data.mapping.'))
                return;

            updateAsset(this.get('id'), 'asset', null, value);
        },
        'model-remove': function(path, value) {
            if (! path.startsWith('data.mapping.'))
                return;

            updateAsset(this.get('id'), 'asset', value);
        },
        'sprite': function (path, value, valueOld) {
            if (! keys['sprite'][path])
                return;

            updateAsset(this.get('id'), 'asset', valueOld, value);
        },
        'entity': function(path, value, valueOld) {
            if (path.startsWith('components.animation.assets.')) {
                var parts = path.split('.');
                if (parts.length !== 4)
                    return;
            } else if (path.startsWith('components.model.mapping.')) {
                var parts = path.split('.');
                if (parts.length !== 4)
                    return;
            } else if (path.startsWith('components.sound.slots')) {
                var parts = path.split('.');
                if (parts.length !== 5 || parts[4] !== 'asset')
                    return;
            } else if (path.startsWith('components.sprite.clips')) {
                var parts = path.split('.');
                if (parts.length !== 5 || parts[4] !== 'spriteAsset')
                    return;
            } else if (! legacyScripts && path.startsWith('components.script.scripts')) {
                var parts = path.split('.');
                if (parts.length === 6 && parts[4] === 'attributes') {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        var type = primaryScript.get('data.scripts.' + parts[3] + '.attributes.' + parts[5] + '.type');
                        if (type !== 'asset')
                            return;
                    } else {
                        return;
                    }
                } else if (parts.length === 4) {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        updateAsset(this.get('resource_id'), 'entity', null, primaryScript.get('id'));
                        return;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            } else if (! keys['entity'][path]) {
                return;
            }

            if (value instanceof Array) {
                for(var i = 0; i < value.length; i++) {
                    updateAsset(this.get('resource_id'), 'entity', valueOld && valueOld[i] || null, value[i]);
                }
            } else {
                updateAsset(this.get('resource_id'), 'entity', valueOld, value);
            }
        },
        'entity-unset': function(path, value) {
            if (path.startsWith('components.model.mapping.')) {
                var parts = path.split('.');
                if (parts.length !== 4)
                    return;
            } else if (path.startsWith('components.sound.slots')) {
                var parts = path.split('.');
                if (parts.length !== 5 || parts[4] !== 'asset')
                    return;
            } else if (path.startsWith('components.sprite.clips')) {
                var parts = path.split('.');
                if (parts.length !== 5 || parts[4] !== 'spriteAsset')
                    return;
            } else if (! legacyScripts && path.startsWith('components.script.scripts')) {
                var parts = path.split('.');
                if (parts.length === 6 && parts[4] === 'attributes') {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        var type = primaryScript.get('data.scripts.' + parts[3] + '.attributes.' + parts[5] + '.type');
                        if (type !== 'asset')
                            return;
                    } else {
                        return;
                    }
                } else if (parts.length === 5) {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        var type = primaryScript.get('data.scripts.' + parts[3] + '.attributes.' + parts[5] + '.type');
                        if (type === 'asset') {
                            if (value.attributes[parts[5]] instanceof Array) {
                                for(var i = 0; i < value.attributes[parts[5]].length; i++) {
                                    updateAsset(this.get('resource_id'), 'entity', value.attributes[parts[5]][i], null);
                                }
                            } else {
                                updateAsset(this.get('resource_id'), 'entity', value.attributes[parts[5]], null);
                            }
                        }
                    } else {
                        return;
                    }
                } else if (parts.length === 4) {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        updateAsset(this.get('resource_id'), 'entity', primaryScript.get('id'), null);

                        for(var attrName in value.attributes) {
                            var type = primaryScript.get('data.scripts.' + parts[3] + '.attributes.' + attrName + '.type');
                            if (type === 'asset') {
                                if (value.attributes[attrName] instanceof Array) {
                                    for(var i = 0; i < value.attributes[attrName].length; i++) {
                                        updateAsset(this.get('resource_id'), 'entity', value.attributes[attrName][i], null);
                                    }
                                } else {
                                    updateAsset(this.get('resource_id'), 'entity', value.attributes[attrName], null);
                                }
                            }
                        }
                    }
                    return;
                } else {
                    return;
                }
            } else if (! keys['entity'][path]) {
                return;
            }

            if (value instanceof Array) {
                for(var i = 0; i < value.length; i++) {
                    updateAsset(this.get('resource_id'), 'entity', value[i], null);
                }
            } else {
                updateAsset(this.get('resource_id'), 'entity', value, null);
            }
        },
        'entity-insert': function(path, value) {
            if (legacyScripts && path.startsWith('components.script.scripts.')) {
                var parts = path.split('.');
                if (parts.length !== 7 || parts[4] !== 'attributes' || parts[6] !== 'value' || this.get(parts.slice(0, 6).join('.') + '.type') !== 'asset')
                    return;
            } else if (! legacyScripts && path.startsWith('components.script.scripts')) {
                var parts = path.split('.');
                if (parts.length === 6 && parts[4] === 'attributes') {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        var type = primaryScript.get('data.scripts.' + parts[3] + '.attributes.' + parts[5] + '.type');
                        if (type !== 'asset')
                            return;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            } else if (! keys['entity-lists'][path]) {
                return;
            }

            if (value instanceof Array) {
                for(var i = 0; i < value.length; i++) {
                    updateAsset(this.get('resource_id'), 'entity', null, value[i]);
                }
            } else {
                updateAsset(this.get('resource_id'), 'entity', null, value);
            }
        },
        'entity-remove': function(path, value) {
            if (legacyScripts && path.startsWith('components.script.scripts.')) {
                var parts = path.split('.');
                if (parts.length !== 7 || parts[4] !== 'attributes' || parts[6] !== 'value' || this.get(parts.slice(0, 6).join('.') + '.type') !== 'asset')
                    return;
            } else if (! legacyScripts && path.startsWith('components.script.scripts')) {
                var parts = path.split('.');
                if (parts.length === 6 && parts[4] === 'attributes') {
                    var primaryScript = editor.call('assets:scripts:assetByScript', parts[3]);
                    if (primaryScript) {
                        var type = primaryScript.get('data.scripts.' + parts[3] + '.attributes.' + parts[5] + '.type');
                        if (type !== 'asset')
                            return;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            } else if (! keys['entity-lists'][path]) {
                return;
            }

            updateAsset(this.get('resource_id'), 'entity', value, null);
        }
    };

    editor.on('assets:scripts:primary:set', function(asset, script) {
        var entities = editor.call('entities:list:byScript', script);
        if (! entities || Object.keys(entities).length === 0)
            return;

        var itemsOrder = asset.get('data.scripts.' + script + '.attributesOrder');
        var items = asset.get('data.scripts.' + script + '.attributes');
        var attributes = [ ];
        for(var i = 0; i < itemsOrder.length; i++) {
            if (items[itemsOrder[i]].type === 'asset')
                attributes.push(itemsOrder[i]);
        }

        for(var i in entities) {
            if (! entities.hasOwnProperty(i))
                continue;

            var entity = entities[i].entity;

            updateAsset(entity.get('resource_id'), 'entity', null, asset.get('id'));

            for(var a = 0; a < attributes.length; a++) {
                var value = entity.get('components.script.scripts.' + script + '.attributes.' + attributes[a]);
                if (! value)
                    continue;

                if (value instanceof Array) {
                    for(var v = 0; v < value.length; v++) {
                        if (typeof(value[v]) === 'number') {
                            updateAsset(entity.get('resource_id'), 'entity', null, value[v]);
                        }
                    }
                } else if (typeof(value) === 'number') {
                    updateAsset(entity.get('resource_id'), 'entity', null, value);
                }
            }
        }
    });

    editor.on('assets:scripts:primary:unset', function(asset, script) {
        var entities = editor.call('entities:list:byScript', script);
        if (! entities || Object.keys(entities).length === 0)
            return;

        var data = asset.get('data.scripts.' + script);
        var attributes = [ ];

        if (data) {
            var itemsOrder = data.attributesOrder;
            var items = data.attributes;

            for(var i = 0; i < itemsOrder.length; i++) {
                if (items[itemsOrder[i]].type === 'asset')
                    attributes.push(itemsOrder[i]);
            }
        }

        for(var i in entities) {
            if (! entities.hasOwnProperty(i))
                continue;

            var entity = entities[i].entity;

            updateAsset(entity.get('resource_id'), 'entity', asset.get('id'), null);

            for(var a = 0; a < attributes.length; a++) {
                var value = entity.get('components.script.scripts.' + script + '.attributes.' + attributes[a]);
                if (! value)
                    continue;

                if (value instanceof Array) {
                    for(var v = 0; v < value.length; v++) {
                        if (typeof(value[v]) === 'number') {
                            updateAsset(entity.get('resource_id'), 'entity', value[v], null);
                        }
                    }
                } else if (typeof(value) === 'number') {
                    updateAsset(entity.get('resource_id'), 'entity', value, null);
                }
            }
        }
    });

    // assets
    editor.on('assets:add', function(asset) {
        if (asset.get('source'))
            return;

        var type = asset.get('type');

        if (type === 'folder')
            return;

        if (onSetMethods[type]) {
            asset.on('*:set', onSetMethods[type]);

            if (onSetMethods[type + '-insert'])
                asset.on('*:insert', onSetMethods[type + '-insert']);

            if (onSetMethods[type + '-remove'])
                asset.on('*:remove', onSetMethods[type + '-remove']);

            for(var key in keys[type])
                updateAsset(asset.get('id'), 'asset', null, asset.get(key));

            if (type === 'model') {
                var mapping = asset.get('data.mapping');
                if (mapping) {
                    for(var i = 0; i < mapping.length; i++)
                        updateAsset(asset.get('id'), 'asset', null, mapping[i].material);
                }
            }
        }
    });

    // entities
    editor.on('entities:add', function(entity) {
        entity.on('*:set', onSetMethods['entity']);
        entity.on('*:unset', onSetMethods['entity-unset']);
        entity.on('*:insert', onSetMethods['entity-insert']);
        entity.on('*:remove', onSetMethods['entity-remove']);

        for(var key in keys['entity'])
            updateAsset(entity.get('resource_id'), 'entity', null, entity.get(key));

        var mappings = entity.get('components.model.mapping');
        if (mappings) {
            for(var ind in mappings) {
                if (! mappings.hasOwnProperty(ind) || ! mappings[ind])
                    continue;

                updateAsset(entity.get('resource_id'), 'entity', null, mappings[ind]);
            }
        }

        for(var key in keys['entity-lists']) {
            var items = entity.get(key);
            if (! items || ! items.length)
                continue;

            for(var i = 0; i < items.length; i++)
                updateAsset(entity.get('resource_id'), 'entity', null, items[i]);
        }

        var slots = entity.get('components.sound.slots');
        if (slots) {
            for(var i in slots) {
                if (! slots.hasOwnProperty(i) || ! slots[i].asset)
                    continue;

                updateAsset(entity.get('resource_id'), 'entity', null, slots[i].asset);
            }
        }

        var clips = entity.get('components.sprite.clips');
        if (clips) {
            for (var key in clips) {
                if (! clips.hasOwnProperty(key) || ! clips[key].spriteAsset) {
                    continue;
                }

                updateAsset(entity.get('resource_id'), 'entity', null, clips[key].spriteAsset);
            }
        }

        var scripts = entity.get('components.script.scripts');

        if (scripts) {
            for(var script in scripts) {
                if (! scripts.hasOwnProperty(script))
                    continue;

                var primaryScript = editor.call('assets:scripts:assetByScript', script);
                if (primaryScript) {
                    updateAsset(entity.get('resource_id'), 'entity', null, primaryScript.get('id'));

                    var attributes = scripts[script].attributes;
                    for(var attr in attributes) {
                        if (! attributes.hasOwnProperty(attr))
                            continue;

                        var type = primaryScript.get('data.scripts.' + script + '.attributes.' + attr + '.type');
                        if (type === 'asset') {
                            var value = attributes[attr];

                            if (value instanceof Array) {
                                for(var v = 0; v < value.length; v++) {
                                    updateAsset(entity.get('resource_id'), 'entity', null, value[v]);
                                }
                            } else if (value) {
                                updateAsset(entity.get('resource_id'), 'entity', null, value);
                            }
                        }
                    }
                }
            }
        }
    });

    // scene settings
    var sceneSettings = editor.call('sceneSettings');
    sceneSettings.on('render.skybox:set', function(value, valueOld) {
        updateAsset('sceneSettings', 'editorSettings', valueOld, value);
    });

    editor.method('assets:used:index', function() {
        return index;
    });
    editor.method('assets:used:get', function(id) {
        if (isNaN(id))
            return true;

        if (! index[id])
            return false;

        return !! (index[id].count && index[id].parent);
    });
});
