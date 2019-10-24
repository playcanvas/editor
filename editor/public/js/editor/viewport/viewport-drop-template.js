editor.once('load', function () {
    'use strict';

    const canvas = editor.call('viewport:canvas');
    if (! canvas) return;

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    editor.call('drop:target', {
        ref: canvas,
        filter: (type, data) => {
            if (type === 'asset.template') {
                const asset = app.assets.get(data.id);
                if (asset) app.assets.load(asset);

                return true;
            }

            if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = app.assets.get(data.ids[i]);
                    if (!asset || asset.type !== 'template' ) return false;
                }

                for (let i = 0; i < data.ids.length; i++) {
                    const asset = app.assets.get(data.ids[i]);
                    app.assets.load(asset);
                }

                return true;
            }
        },
        drop: function (type, data) {
            if (! config.scene.id)
                return;

            const assets = [];

            if (type === 'asset.template') {
                const asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) assets.push(asset);
            } else if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    var asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'template')
                        assets.push(asset);
                }
            }

            if (! assets.length)
                return;

            // parent
            var parent = null;
            if (editor.call('selector:type') === 'entity') {
                parent = editor.call('selector:items')[0];
            }

            if (! parent) {
                parent = editor.call('entities:root');
            }

            let newEntities = [];

            function undo() {
                newEntities.forEach(e => {
                    e = e.latest();
                    if (e) {
                        editor.call('entities:removeEntity', e);
                    }
                });
                editor.call('viewport:render');
            }

            function redo() {
                // add instances
                newEntities = assets.map(asset => editor.call('template:addInstance', asset, parent));

                // select them
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', newEntities);
                editor.once('selector:change', () => {
                    editor.call('selector:history', true);
                });

                const vec = new pc.Vec3();

                if (ui.Tree._ctrl && ui.Tree._ctrl()) {
                    // position entities in front of camera based on aabb
                    const camera = editor.call('camera:current');
                    const aabb = editor.call('entities:aabb', newEntities);
                    vec.copy(camera.forward).scale(aabb.halfExtents.length() * 2.2);
                    vec.add(camera.getPosition());

                    var tmp = new pc.Entity();
                    parent.entity.addChild(tmp);
                    tmp.setPosition(vec);
                    vec.copy(tmp.getLocalPosition());
                    tmp.destroy();
                } else {
                    vec.set(0, 0, 0);
                }

                newEntities.forEach(e => {
                    e.history.enabled = false;
                    e.set('position', [vec.x, vec.y, vec.z]);
                    e.history.enabled = true;
                });

                editor.call('viewport:render');
                editor.call('viewport:focus');
            }

            editor.call('history:add', {
                name: 'add template instance',
                undo: undo,
                redo: redo
            });

            redo();
        }
    });
});
