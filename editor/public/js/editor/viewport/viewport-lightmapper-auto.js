editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    var entityAssetLoading = { };
    var bakingNextFrame = false;
    var state = false;
    var timeLast = 0;
    var timeDelay = 500;
    var queued = false;


    editor.on('lightmapper:baked', function() {
        queued = false;
        timeLast = Date.now();
    });


    editor.method('lightmapper:auto', function(value) {
        if (value === undefined)
            return state;

        if (state === value)
            return;

        state = value;
        editor.emit('lightmapper:auto', state);

        rebakeScene();
    });
    editor.emit('lightmapper:auto', state);


    // track entities model assets loading state to re-bake
    var rebakeEntity = function(entity, force) {
        if (! (state || force))
            return;

        if (! entity.has('components.model'))
            return;

        var type = entity.get('components.model.type');

        if (type === 'asset') {
            var assetId = entity.get('components.model.asset');
            if (! assetId)
                return;

            var asset = app.assets.get(parseInt(assetId, 10));
            if (! asset || ! asset.resource) {
                var loading = entityAssetLoading[entity.get('resource_id')];
                if (loading) {
                    if (loading.assetId === assetId)
                        return;

                    app.assets.off('load:' + loading.assetId, loading.fn);
                    delete entityAssetLoading[entity.get('resource_id')];
                }

                loading = {
                    assetId: assetId,
                    fn: function(asset) {
                        delete entityAssetLoading[entity.get('resource_id')];

                        if (asset.id !== parseInt(entity.get('components.model.asset'), 10))
                            return;

                        rebakeEntity(entity);
                    }
                };
                app.assets.once('load:' + assetId, loading.fn);
                return;
            }
        }

        editor.call('viewport:render');
        editor.once('viewport:update', function() {
            // console.log('rebake self');
            editor.call('lightmapper:bake', [ entity ]);
        });
    };

    var rebakeScene = function(force) {
        if (! (state || force))
            return;

        if (bakingNextFrame)
            return;

        if (! force && (Date.now() - timeLast) < timeDelay) {
            if (! queued) {
                queued = true;
                setTimeout(function() {
                    if (! queued) return;
                    rebakeScene();
                }, (timeDelay - (Date.now() - timeLast)) + 16);
            }
            return;
        }

        bakingNextFrame = true;
        editor.call('viewport:render');
        editor.once('viewport:update', function() {
            if (! bakingNextFrame)
                return;

            bakingNextFrame = false;
            // console.log('rebake global');
            editor.call('lightmapper:bake');
        });
    };


    editor.on('viewport:update', function() {
        if (queued && (Date.now() - timeLast) >= timeDelay)
            rebakeScene();
    });


    // bake once all assets are loaded on first time-load
    var loadingAssets = { };
    var onLoadStart = function(asset) {
        loadingAssets[asset.id] = true;
        asset.once('load', function() {
            delete loadingAssets[asset.id];

            if (Object.keys(loadingAssets).length === 0) {
                app.assets.off('load:start', onLoadStart);
                rebakeScene(true);
            }
        });
    };
    app.assets.on('load:start', onLoadStart);

    // re-bake on scene switches
    editor.on('scene:load', function() {
        // needs to wait 3 frames
        // before it is safe to re-bake
        // don't ask why :D

        editor.call('viewport:render');
        editor.once('viewport:update', function() {
            editor.call('viewport:render');
            editor.once('viewport:update', function() {
                rebakeScene(true);
            });
        });
    });

    // re-bake on scene settigns loaded
    editor.on('sceneSettings:load', function() {
        rebakeScene(true);
    });


    var evtRebakeEntity = function() {
        rebakeEntity(this);
    };
    var evtRebakeLight = function() {
        if (! this.get('components.light.bake'))
            return;

        rebakeScene();
    };

    var evtRebakeScene = function() {
        rebakeScene();
    };

    // subscribe to model, light and scene changes
    // to do rebaking
    var fieldsLocal = [
        'components.model.lightmapped',
        'components.model.lightmapSizeMultiplier',
        'components.model.receiveShadows'
    ];
    var fieldsLight = [
        'components.light.color',
        'components.light.intensity',
        'components.light.range',
        'components.light.falloffMode',
        'components.light.castShadows',
        'components.light.shadowResolution',
        'components.light.shadowBias',
        'components.light.normalOffsetBias'
    ];
    var fieldsGlobal = [
        'enabled',
        'components.model.enabled',
        'components.model.type',
        'components.model.asset',
        'components.model.castShadowsLightmap',
        'components.light.bake'
    ];

    editor.on('entities:add', function(entity) {
        // model
        for(var i = 0; i < fieldsLocal.length; i++)
            entity.on(fieldsLocal[i] + ':set', evtRebakeEntity);

        // light
        for(var i = 0; i < fieldsLight.length; i++)
            entity.on(fieldsLight[i] + ':set', evtRebakeLight);

        // global
        for(var i = 0; i < fieldsGlobal.length; i++)
            entity.on(fieldsGlobal[i] + ':set', evtRebakeScene);
    });

    editor.on('gizmo:translate:end', evtRebakeScene);
    editor.on('gizmo:rotate:end', evtRebakeScene);
    editor.on('gizmo:scale:end', evtRebakeScene);
});
