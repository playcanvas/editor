editor.once('load', () => {
    const canvas = editor.call('viewport:canvas');
    if (!canvas) {
        return;
    }

    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    editor.call('drop:target', {
        ref: canvas,
        filter: (type, data) => {
            if (type === 'asset.template') {
                const asset = app.assets.get(data.id);
                if (asset) {
                    app.assets.load(asset);
                }

                return true;
            }

            if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = app.assets.get(data.ids[i]);
                    if (!asset || asset.type !== 'template') {
                        return false;
                    }
                }

                for (let i = 0; i < data.ids.length; i++) {
                    const asset = app.assets.get(data.ids[i]);
                    app.assets.load(asset);
                }

                return true;
            }
        },
        drop: function (type, data) {
            if (!config.scene.id) {
                return;
            }

            const assets = [];

            if (type === 'asset.template') {
                const asset = editor.call('assets:get', parseInt(data.id, 10));
                if (asset) {
                    assets.push(asset);
                }
            } else if (type === 'assets') {
                for (let i = 0; i < data.ids.length; i++) {
                    const asset = editor.call('assets:get', parseInt(data.ids[i], 10));
                    if (asset && asset.get('type') === 'template') {
                        assets.push(asset);
                    }
                }
            }

            if (!assets.length) {
                return;
            }

            // parent
            let parent = null;
            if (editor.call('selector:type') === 'entity') {
                parent = editor.call('selector:items')[0];
            }

            if (!parent) {
                parent = editor.call('entities:root');
            }

            const ctrlDown = editor.call('hotkey:ctrl');
            let cameraPos, cameraForward;

            if (ctrlDown) {
                // position entities in front of camera based on aabb
                const camera = editor.call('camera:current');
                cameraForward = camera.forward.clone();
                cameraPos = camera.getPosition().clone();
            }

            editor.api.globals.assets.instantiateTemplates(assets.map(a => a.apiAsset), parent.apiEntity, {
                index: parent.get('children').length,
                select: true
            })
            .then((entities) => {
                const entityObservers = entities.map(e => e.observer);
                const vec = new pc.Vec3();

                if (ctrlDown) {
                    // position entities in front of camera based on aabb
                    const aabb = editor.call('entities:aabb', entityObservers);
                    vec.copy(cameraForward).scale(aabb.halfExtents.length() * 2.2);
                    vec.add(cameraPos);

                    const tmp = new pc.Entity();
                    parent.entity.addChild(tmp);
                    tmp.setPosition(vec);
                    vec.copy(tmp.getLocalPosition());
                    tmp.destroy();
                } else {
                    vec.set(0, 0, 0);
                }

                entityObservers.forEach((e) => {
                    e.history.enabled = false;
                    e.set('position', [vec.x, vec.y, vec.z]);
                    e.history.enabled = true;
                });

                editor.call('viewport:render');
                editor.call('viewport:focus');

            })
            .catch((err) => {
                editor.call('status:error', err);
            });
        }
    });
});
