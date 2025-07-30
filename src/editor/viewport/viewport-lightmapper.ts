editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    let uv1MissingAssets = { };


    // bake
    editor.method('lightmapper:bake', (entities) => {
        if (!entities) {
            entities = editor.call('entities:list').filter((e) => {
                return e.get('components.model.lightmapped');
            });
        }

        uv1MissingAssets = { };
        const areaJobs = { };
        let jobs = 0;

        const readyForBake = function () {
            app.lightmapper.bake(null, app.scene.lightmapMode);
            editor.call('viewport:render');
            editor.emit('lightmapper:baked');
        };

        // validate lightmapped entities
        for (let i = 0; i < entities.length; i++) {
            const obj = entities[i];

            // might be primitive
            if (obj.get('components.model.type') !== 'asset') {
                continue;
            }

            // might have no model asset attached
            const assetId = obj.get('components.model.asset');
            if (!assetId) {
                continue;
            }

            // model asset might be missing
            const asset = editor.call('assets:get', assetId);
            if (!asset) {
                continue;
            }

            // check if asset has uv1
            const uv1 = asset.has('meta.attributes.texCoord1');
            if (!uv1) {
                // uv1 might be missing
                if (!uv1MissingAssets[assetId]) {
                    uv1MissingAssets[assetId] = asset;
                }
                continue;
            }

            // check if asset has area
            const area = asset.get('data.area');
            if (!area && !areaJobs[assetId]) {
                // if area not available
                // recalculate area
                areaJobs[assetId] = asset;
                jobs++;
                editor.call('assets:model:area', asset, () => { // eslint-disable-line no-loop-func
                    jobs--;

                    if (jobs === 0) {
                        readyForBake();
                    }
                });
            }
        }

        editor.call('lightmapper:uv1missing', uv1MissingAssets);

        if (jobs === 0) {
            readyForBake();
        }
    });


    editor.method('entities:shadows:update', () => {
        const entities = editor.call('entities:list').filter((e) => {
            return e.get('components.light.castShadows') && e.get('components.light.shadowUpdateMode') === 1 && e.entity && e.entity.light && e.entity.light.shadowUpdateMode === pc.SHADOWUPDATE_THISFRAME;
        });

        if (!entities.length) {
            return;
        }

        for (let i = 0; i < entities.length; i++) {
            entities[i].entity.light.light.shadowUpdateMode = pc.SHADOWUPDATE_THISFRAME;
        }

        editor.call('viewport:render');
    });
});
