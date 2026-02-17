import { BoundingBox, Entity as PcEntity, Vec3 } from 'playcanvas';

import { config } from '@/editor/config';
import { Entity } from '@/editor-api';

editor.once('load', () => {
    const canvas = editor.call('viewport:canvas');
    if (!canvas) {
        return;
    }

    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    const aabb = new BoundingBox();
    const vecA = new Vec3();
    const vecB = new Vec3();
    const vecC = new Vec3();

    editor.call('drop:target', {
        ref: canvas,
        filter: function (type: string, data: { id: string | number } | { ids: string[] }): boolean {
            if (type === 'asset.gsplat') {
                const asset = app.assets.get(data.id);
                if (asset) {
                    app.assets.load(asset);
                }
                return true;
            }

            if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', data.ids[i]);
                    if (!asset) {
                        return false;
                    }

                    if (asset.get('type') !== 'gsplat') {
                        return false;
                    }
                }

                for (let i = 0; i < data.ids.length; i++) {
                    const asset = app.assets.get(data.ids[i]);
                    if (asset) {
                        app.assets.load(asset);
                    }
                }

                return true;
            }
        },
        drop: function (type: string, data: { id: string } | { ids: string[] }) {
            if (!config.scene.id) {
                return;
            }

            const assets = [];

            if (type === 'asset.gsplat') {
                const asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) {
                    assets.push(asset);
                }
            } else if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'gsplat') {
                        assets.push(asset);
                    }
                }
            }

            if (!assets.length) {
                return;
            }

            // parent
            let parent = null;
            if (editor.api.globals.selection.items[0] instanceof Entity) {
                parent = editor.api.globals.selection.items[0];
            } else {
                parent = editor.api.globals.entities.root;
            }

            const entities = [];
            data = [];

            // calculate aabb
            let first = true;
            const gsplatAabb = new BoundingBox();
            for (let i = 0; i < assets.length; i++) {
                const assetEngine = app.assets.get(assets[i].get('id'));
                if (assetEngine?.resource) {
                    assetEngine.resource.gsplatData.calcAabb(gsplatAabb);
                    if (first) {
                        first = false;
                        aabb.copy(gsplatAabb);
                    } else {
                        aabb.add(gsplatAabb);
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
                vecA.copy(camera.forward).mulScalar(aabb.halfExtents.length() * 2.2);
                vecB.copy(camera.getPosition()).add(vecA);
                vecC.copy(vecB).sub(aabb.center);

                const tmp = new PcEntity();
                parent.observer.entity.addChild(tmp);
                tmp.setPosition(vecC);
                vecC.copy(tmp.getLocalPosition());
                tmp.destroy();

                // focus distance
                distance = vecA.copy(camera.getPosition()).sub(vecB).length();
            } else {
                vecC.set(0, 0, 0);
                vecB.copy(parent.observer.entity.getPosition()).add(aabb.center);
                distance = aabb.halfExtents.length() * 2.2;
            }

            for (let i = 0; i < assets.length; i++) {
                const component = editor.call('components:getDefault', 'gsplat');
                component.asset = parseInt(assets[i].get('id'), 10);

                let name = assets[i].get('name');
                if (/\.ply$/i.test(name)) {
                    name = name.slice(0, -4) || 'Untitled';
                }

                // new entity
                const entity = editor.api.globals.entities.create(({
                    parent: parent,
                    name: name,
                    position: [vecC.x, vecC.y, vecC.z],
                    rotation: [0, 0, 180],
                    components: {
                        gsplat: component
                    }
                } as any), {
                    history: false
                });

                entities.push(entity);
                data.push(entity.json());
            }

            let prevSelection = editor.api.globals.selection.items;
            editor.api.globals.selection.set(entities, { history: true });

            editor.api.globals.history.add({
                name: `new gsplat entities ${entities.length}`,
                combine: false,
                undo: function () {
                    editor.api.globals.entities.delete(entities, { history: false });
                    editor.api.globals.selection.set(prevSelection, { history: false });
                },
                redo: function () {
                    parent = parent.latest();
                    if (!parent) {
                        return;
                    }

                    entities.length = 0;

                    for (let i = 0; i < data.length; i++) {
                        const entity = editor.api.globals.entities.create(data[i], { history: false });
                        entities.push(entity);
                    }

                    prevSelection = editor.api.globals.selection.items;
                    editor.api.globals.selection.set(entities, { history: false });

                    editor.call('viewport:render');
                    editor.call('camera:focus', vecB, distance);
                }
            });

            editor.call('viewport:render');
            editor.call('camera:focus', vecB, distance);
        }
    });
});
