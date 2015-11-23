editor.once('load', function() {
    'use strict';

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
        'model': { },
        'entity': {
            'components.model.materialAsset': true,
            'components.model.asset': true,
            'components.collision.asset': true,
            'components.particlesystem.colorMapAsset': true,
            'components.particlesystem.normalMapAsset': true,
            'components.particlesystem.mesh': true
        },
        'entity-lists': {
            'components.animation.assets': true,
            'components.audiosource.assets': true,
            // 'components.script.scripts': true
        }
    };
    var updateAsset = function(referer, oldId, newId) {
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
                var item = editor.call('assets:get', referer);
                if (! item)
                    item = editor.call('entities:get', referer);
                if (item) {
                    index[newId].ref[referer][1] = item.once('destroy', function() {
                        updateAsset(referer, newId);
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

            updateAsset(this.get('id'), valueOld, value);
        },
        'material': function(path, value, valueOld) {
            if (! keys['material'][path])
                return;

            updateAsset(this.get('id'), valueOld, value);
        },
        'model': function(path, value, valueOld) {
            if (path.startsWith('data.mapping.') && path.slice(-8) === 'material')
                updateAsset(this, valueOld, value);

            if (! keys['model'][path])
                return;

            updateAsset(this.get('id'), valueOld, value);
        },
        'model-insert': function(path, value) {
            if (! path.startsWith('data.mapping.'))
                return;

            updateAsset(this.get('id'), null, value);
        },
        'model-remove': function(path, value) {
            if (! path.startsWith('data.mapping.'))
                return;

            updateAsset(this.get('id'), value);
        },
        'entity': function(path, value, valueOld) {
            if (path.startsWith('components.model.mapping.')) {
                var parts = path.split('.');
                if (parts.length !== 4)
                    return;
            } else if (! keys['entity'][path]) {
                return;
            }

            updateAsset(this.get('resource_id'), valueOld, value);
        },
        'entity-unset': function(path, value) {
            if (path.startsWith('components.model.mapping.')) {
                var parts = path.split('.');
                if (parts.length !== 4)
                    return;
            } else if (! keys['entity'][path]) {
                return;
            }

            updateAsset(this.get('resource_id'), value, null);
        },
        'entity-insert': function(path, value) {
            if (path.startsWith('components.script.scripts.')) {
                var parts = path.split('.');
                if (parts.length !== 7 || parts[4] !== 'attributes' || parts[6] !== 'value' || this.get(parts.slice(0, 6).join('.') + '.type') !== 'asset')
                    return;
            } else if (! keys['entity-lists'][path]) {
                return;
            }

            updateAsset(this.get('resource_id'), null, value);
        },
        'entity-remove': function(path, value) {
            if (path.startsWith('components.script.scripts.')) {
                var parts = path.split('.');
                if (parts.length !== 7 || parts[4] !== 'attributes' || parts[6] !== 'value' || this.get(parts.slice(0, 6).join('.') + '.type') !== 'asset')
                    return;
            } else if (! keys['entity-lists'][path]) {
                return;
            }

            updateAsset(this.get('resource_id'), value, null);
        }
    };

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

            for(var key in keys[type]) {
                updateAsset(asset.get('id'), null, asset.get(key));
            }

            if (type === 'model') {
                var mapping = asset.get('data.mapping');
                if (mapping) {
                    for(var i = 0; i < mapping.length; i++) {
                        updateAsset(asset.get('id'), null, mapping[i].material);
                    }
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
            updateAsset(entity.get('resource_id'), null, entity.get(key));

        var mappings = entity.get('components.model.mapping');
        if (mappings) {
            for(var ind in mappings) {
                if (! mappings.hasOwnProperty(ind) || ! mappings[ind])
                    continue;

                updateAsset(entity.get('resource_id'), null, mappings[ind]);
            }
        }

        for(var key in keys['entity-lists']) {
            var items = entity.get(key);
            if (! items || ! items.length)
                continue;

            for(var i = 0; i < items.length; i++)
                updateAsset(entity.get('resource_id'), null, items[i]);
        }
    });

    // scene settings
    var sceneSettings = editor.call('sceneSettings');
    sceneSettings.on('render.skybox:set', function(value, valueOld) {
        updateAsset('sceneSettings', valueOld, value);
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
