editor.once('load', function () {
    'use strict';

    const canvas = editor.call('viewport:canvas');
    if (! canvas) return;

    const app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    const aabb = new pc.BoundingBox();
    const vecA = new pc.Vec3();
    const vecB = new pc.Vec3();
    const vecC = new pc.Vec3();

    editor.call('drop:target', {
        ref: canvas,
        filter: function (type, data) {
            if (type === 'asset.model') {
                const asset = app.assets.get(data.id);
                if (asset) app.assets.load(asset);

                return true;
            }

            if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', data.ids[i]);
                    if (! asset)
                        return false;

                    if (asset.get('type') !== 'model')
                        return false;
                }

                for (let i = 0; i < data.ids.length; i++) {
                    const asset = app.assets.get(data.ids[i]);
                    if (asset) app.assets.load(asset);
                }

                return true;
            }
        },
        drop: function (type, data) {
            if (! config.scene.id)
                return;

            const assets = [];

            if (type === 'asset.model') {
                const asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) assets.push(asset);
            } else if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'model')
                        assets.push(asset);
                }
            }

            if (!assets.length)
                return;

            // parent
            let parent = null;
            if (editor.call('selector:type') === 'entity')
                parent = editor.call('selector:items')[0];

            if (!parent)
                parent = editor.call('entities:root');

            const entities = [];
            data = [];

            // calculate aabb
            let first = true;
            for (let i = 0; i < assets.length; i++) {
                const assetEngine = app.assets.get(assets[i].get('id'));
                if (! assetEngine) continue;

                if (assetEngine.resource) {
                    const meshes = assetEngine.resource.meshInstances;
                    for (let m = 0; m < meshes.length; m++) {
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
            const camera = editor.call('camera:current');
            let distance = 0;

            const ctrlDown = editor.call('hotkey:ctrl');

            if (ctrlDown) {
                vecA.copy(camera.forward).scale(aabb.halfExtents.length() * 2.2);
                vecB.copy(camera.getPosition()).add(vecA);
                vecC.copy(vecB).sub(aabb.center);

                const tmp = new pc.Entity();
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
                const component = editor.call('components:getDefault', 'model');
                component.type = 'asset';
                component.asset = parseInt(assets[i].get('id'), 10);

                let name = assets[i].get('name');
                if (/\.json$/i.test(name)) {
                    name = name.slice(0, -5) || 'Untitled';
                } else if (/\.glb$/i.test(name)) {
                    name = name.slice(0, -4) || 'Untitled';
                }

                // new entity
                const entity = editor.call('entities:new', {
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

            const selectorType = editor.call('selector:type');
            const selectorItems = editor.call('selector:items');
            if (selectorType === 'entity') {
                for (let i = 0; i < selectorItems.length; i++)
                    selectorItems[i] = selectorItems[i].get('resource_id');
            }

            const parentId = parent.get('resource_id');
            const resourceIds = [];
            for (let i = 0; i < entities.length; i++)
                resourceIds.push(entities[i].get('resource_id'));

            editor.call('history:add', {
                name: 'new model entities ' + entities.length,
                undo: function () {
                    for (let i = 0; i < resourceIds.length; i++) {
                        const entity = editor.call('entities:get', resourceIds[i]);
                        if (! entity)
                            continue;

                        editor.call('entities:removeEntity', entity);
                    }

                    if (selectorType === 'entity' && selectorItems.length) {
                        const items = [];
                        for (let i = 0; i < selectorItems.length; i++) {
                            const item = editor.call('entities:get', selectorItems[i]);
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
                    const parent = editor.call('entities:get', parentId);
                    if (! parent)
                        return;

                    const entities = [];

                    for (let i = 0; i < data.length; i++) {
                        const entity = new Observer(data[i]);
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
