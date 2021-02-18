editor.once('load', function () {
    'use strict';

    var canvas = editor.call('viewport:canvas');
    if (! canvas) return;

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var aabb = new pc.BoundingBox();
    var vecA = new pc.Vec3();
    var vecB = new pc.Vec3();
    var vecC = new pc.Vec3();


    editor.call('drop:target', {
        ref: canvas,
        filter: function (type, data) {
            if (type === 'asset.model') {
                var asset = app.assets.get(data.id);
                if (asset) app.assets.load(asset);

                return true;
            }

            if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    var asset = editor.call('assets:get', data.ids[i]);
                    if (! asset)
                        return false;

                    if (asset.get('type') !== 'model')
                        return false;
                }

                for (let i = 0; i < data.ids.length; i++) {
                    var asset = app.assets.get(data.ids[i]);
                    if (asset) app.assets.load(asset);
                }

                return true;
            }
        },
        drop: function (type, data) {
            if (! config.scene.id)
                return;

            var assets = [];

            if (type === 'asset.model') {
                var asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) assets.push(asset);
            } else if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    var asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'model')
                        assets.push(asset);
                }
            }

            if (! assets.length)
                return;

            // parent
            var parent = null;
            if (editor.call('selector:type') === 'entity')
                parent = editor.call('selector:items')[0];

            if (! parent)
                parent = editor.call('entities:root');

            var entities = [];
            var data = [];

            // calculate aabb
            var first = true;
            for (let i = 0; i < assets.length; i++) {
                var assetEngine = app.assets.get(assets[i].get('id'));
                if (! assetEngine) continue;

                if (assetEngine.resource) {
                    var meshes = assetEngine.resource.meshInstances;
                    for (var m = 0; m < meshes.length; m++) {
                        if (first) {
                            first = false;
                            aabb.copy(meshes[m].aabb);
                        } else {
                            aabb.add(meshes[m].aabb);
                        }
                    }
                }
            }

            if (first) {
                aabb.center.set(0, 0, 0);
                aabb.halfExtents.set(1, 1, 1);
            }

            // calculate point
            var camera = editor.call('camera:current');
            var distance = 0;

            const ctrlDown = editor.call('hotkey:ctrl');

            if (ctrlDown) {
                vecA.copy(camera.forward).scale(aabb.halfExtents.length() * 2.2);
                vecB.copy(camera.getPosition()).add(vecA);
                vecC.copy(vecB).sub(aabb.center);

                var tmp = new pc.Entity();
                parent.entity.addChild(tmp);
                tmp.setPosition(vecC);
                vecC.copy(tmp.getLocalPosition());
                tmp.destroy();

                // focus distance
                distance = vecA.copy(camera.getPosition()).sub(vecB).length();
            } else {
                vecC.set(0, 0, 0);
                vecB.copy(parent.entity.getPosition()).add(aabb.center);
                distance = aabb.halfExtents.length() * 2.2;
            }

            for (let i = 0; i < assets.length; i++) {
                var component = editor.call('components:getDefault', 'model');
                component.type = 'asset';
                component.asset = parseInt(assets[i].get('id'), 10);

                var name = assets[i].get('name');
                if (/\.json$/i.test(name)) {
                    name = name.slice(0, -5) || 'Untitled';
                } else if (/\.glb$/i.test(name)) {
                    name = name.slice(0, -4) || 'Untitled';
                }

                // new entity
                var entity = editor.call('entities:new', {
                    parent: parent,
                    name: name,
                    position: [vecC.x, vecC.y, vecC.z],
                    components: {
                        model: component
                    },
                    noSelect: true,
                    noHistory: true
                });

                entities.push(entity);
                data.push(entity.json());
            }

            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', entities);
            editor.once('selector:change', function () {
                editor.call('selector:history', true);
            });

            var selectorType = editor.call('selector:type');
            var selectorItems = editor.call('selector:items');
            if (selectorType === 'entity') {
                for (let i = 0; i < selectorItems.length; i++)
                    selectorItems[i] = selectorItems[i].get('resource_id');
            }

            var parentId = parent.get('resource_id');
            var resourceIds = [];
            for (let i = 0; i < entities.length; i++)
                resourceIds.push(entities[i].get('resource_id'));

            editor.call('history:add', {
                name: 'new model entities ' + entities.length,
                undo: function () {
                    for (let i = 0; i < resourceIds.length; i++) {
                        var entity = editor.call('entities:get', resourceIds[i]);
                        if (! entity)
                            continue;

                        editor.call('entities:removeEntity', entity);
                    }

                    if (selectorType === 'entity' && selectorItems.length) {
                        var items = [];
                        for (let i = 0; i < selectorItems.length; i++) {
                            var item = editor.call('entities:get', selectorItems[i]);
                            if (item)
                                items.push(item);
                        }

                        if (items.length) {
                            editor.call('selector:history', false);
                            editor.call('selector:set', selectorType, items);
                            editor.once('selector:change', function () {
                                editor.call('selector:history', true);
                            });
                        }
                    }
                },
                redo: function () {
                    var parent = editor.call('entities:get', parentId);
                    if (! parent)
                        return;

                    var entities = [];

                    for (let i = 0; i < data.length; i++) {
                        var entity = new Observer(data[i]);
                        entities.push(entity);
                        editor.call('entities:addEntity', entity, parent, false);
                    }

                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', entities);
                    editor.once('selector:change', function () {
                        editor.call('selector:history', true);
                    });

                    editor.call('viewport:render');
                    editor.call('camera:focus', vecB, distance);
                }
            });

            editor.call('viewport:render');
            editor.call('camera:focus', vecB, distance);
        }
    });
});
