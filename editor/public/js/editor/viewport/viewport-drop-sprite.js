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
            if (type === 'asset.sprite') {
                const asset = app.assets.get(data.id);
                if (asset) app.assets.load(asset);

                return true;
            }

            if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', data.ids[i]);
                    if (! asset)
                        return false;

                    if (asset.get('type') !== 'sprite')
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

            if (type === 'asset.sprite') {
                const asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) assets.push(asset);
            } else if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'sprite')
                        assets.push(asset);
                }
            }

            if (! assets.length)
                return;

            // parent
            let parent = null;
            if (editor.selection.items[0] instanceof api.Entity) {
                parent = editor.selection.items[0];
            } else {
                parent = editor.entities.root;
            }

            const entities = [];
            data = [];

            // calculate aabb
            let first = true;
            for (let i = 0; i < assets.length; i++) {
                const assetEngine = app.assets.get(assets[i].get('id'));
                if (! assetEngine) continue;

                if (assetEngine.resource) {
                    const mi = assetEngine.resource._meshInstance;
                    if (! mi) continue;

                    if (first) {
                        first = false;
                        aabb.copy(mi.aabb);
                    } else {
                        aabb.add(mi.aabb);
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
                parent._observer.entity.addChild(tmp);
                tmp.setPosition(vecC);
                vecC.copy(tmp.getLocalPosition());
                tmp.destroy();

                // focus distance
                distance = vecA.copy(camera.getPosition()).sub(vecB).length();
            } else {
                vecC.set(0, 0, 0);
                vecB.copy(parent._observer.entity.getPosition()).add(aabb.center);
                distance = aabb.halfExtents.length() * 2.2;
            }

            for (let i = 0; i < assets.length; i++) {
                const component = editor.call('components:getDefault', 'sprite');

                const name = assets[i].get('name') || 'Untitled';

                if (assets[i].get('data.frameKeys').length > 1) {
                    component.type = 'animated';
                    component.clips = {
                        '0': {
                            name: name,
                            fps: 10,
                            loop: true,
                            autoPlay: true,
                            spriteAsset: parseInt(assets[i].get('id'), 10)
                        }
                    };
                    component.autoPlayClip = name;
                } else {
                    component.spriteAsset =  parseInt(assets[i].get('id'), 10);
                }

                // new entity
                const entity = editor.entities.create({
                    parent: parent,
                    name: name,
                    position: [vecC.x, vecC.y, vecC.z],
                    components: {
                        sprite: component
                    }
                }, { history: false });

                entities.push(entity);
                data.push(entity.json());
            }

            let previousSelection = editor.selection.items;
            editor.selection.set(entities, { history: false });

            editor.history.add({
                name: 'new sprite entities ' + entities.length,
                undo: function () {
                    editor.entities.delete(entities, { history: false });
                    editor.selection.set(previousSelection, { history: false });
                },
                redo: function () {
                    if (!parent) return;
                    parent = parent.latest();
                    if (!parent) return;

                    entities.length = 0;

                    for (let i = 0; i < data.length; i++) {
                        const entity = editor.entities.create(data[i], { history: false });
                        entities.push(entity);
                    }

                    previousSelection = editor.selection.items;
                    editor.selection.set(entities, { history: false });

                    editor.call('viewport:render');
                    editor.call('camera:focus', vecB, distance);
                }
            });

            editor.call('viewport:render');
            editor.call('camera:focus', vecB, distance);
        }
    });
});
