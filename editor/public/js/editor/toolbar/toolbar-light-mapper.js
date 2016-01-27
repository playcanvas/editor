editor.once('load', function() {
    'use strict';

    if (! config.owner.superUser)
        return;

    var app;
    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');

    // coordinate system
    var buttonBake = new ui.Button({
        text: '&#57745;'
    });
    buttonBake.class.add('pc-icon', 'light-mapper');
    toolbar.append(buttonBake);

    buttonBake.on('click', function () {
        editor.call('lightMapper:bake');
    });
    editor.on('lightMapper:uv1Missing', function(state) {
        if (state) {
            buttonBake.class.add('active');
        } else {
            buttonBake.class.remove('active');
        }
    });


    // tooltip
    var tooltipBake = Tooltip.attach({
        target: buttonBake.element,
        align: 'left',
        root: root
    });
    tooltipBake.class.add('light-mapper');
    tooltipBake.hoverable = true;

    var elHeader = document.createElement('span');
    elHeader.classList.add('header');
    elHeader.textContent = 'Light Mapper';
    tooltipBake.innerElement.appendChild(elHeader);

    var elUV1 = document.createElement('div');
    elUV1.classList.add('uv1');
    elUV1.textContent = 'UV1 is missing on some models. Please upload models with UV1 or use ';
    tooltipBake.innerElement.appendChild(elUV1);

    var btnAutoUnwrap = new ui.Button({
        text: 'Auto-Unwrap'
    });
    btnAutoUnwrap.parent = tooltipBake;
    elUV1.appendChild(btnAutoUnwrap.element);
    btnAutoUnwrap.on('click', function() {
        if (! uv1Missing)
            return;

        var assetIds = Object.keys(uv1MissingAssets);
        for(var i = 0; i < assetIds.length; i++) {
            if (! uv1MissingAssets.hasOwnProperty(assetIds[i]))
                continue;

            var asset = uv1MissingAssets[assetIds[i]];
            editor.call('assets:model:unwrap', asset);
        }
    });


    // bake
    editor.method('lightMapper:bake', function() {
        var entities = editor.call('entities:list').filter(function(e) {
            return e.get('components.model.lightMapReceive');
        });

        uv1MissingAssets = { };
        var areaJobs = { };
        var jobs = 0;

        var readyForBake = function() {
            app.lightMapper.bake();
            editor.call('viewport:render');
        };

        // validate lightmapped entities
        for(var i = 0; i < entities.length; i++) {
            var obj = entities[i];

            // might be primitive
            if (obj.get('components.model.type') !== 'asset')
                continue;

            // might have no model asset attached
            var assetId = obj.get('components.model.asset');
            if (! assetId)
                continue;

            // model asset might be missing
            var asset = editor.call('assets:get', assetId);
            if (! asset)
                continue;

            // check if asset has uv1
            var uv1 = asset.has('meta.attributes.texCoord1');
            if (! uv1) {
                // uv1 might be missing
                if (! uv1MissingAssets[assetId])
                    uv1MissingAssets[assetId] = asset;
                continue;
            }

            // check if asset has area
            var area = asset.get('data.area');
            if (! area && ! areaJobs[assetId]) {
                // if area not available
                // recalculate area
                areaJobs[assetId] = asset;
                jobs++;
                editor.call('assets:model:area', asset, function() {
                    jobs--;

                    if (jobs === 0)
                        readyForBake();
                });
            }
        }

        editor.call('lightMapper:uv1missing', Object.keys(uv1MissingAssets).length !== 0);

        if (jobs === 0)
            readyForBake();
    });


    // hotkey ctrl+b
    editor.call('hotkey:register', 'lightMapper:bake', {
        key: 'b',
        ctrl: true,
        callback: function() {
            editor.call('lightMapper:bake');
        }
    });


    // manage if uv1 is missing
    var uv1Missing = false;
    var uv1MissingAssets = { };

    editor.on('assets:model:unwrap', function(asset) {
        if (! uv1MissingAssets[asset.get('id')])
            return;

        delete uv1MissingAssets[asset.get('id')];
        editor.call('lightMapper:uv1missing', Object.keys(uv1MissingAssets).length !== 0);
    })

    editor.method('lightMapper:uv1missing', function(state) {
        if (state === undefined)
            return uv1Missing;

        if (uv1Missing === state)
            return;

        uv1Missing = state;
        editor.emit('lightMapper:uv1Missing', uv1Missing);
    });

    tooltipBake.on('show', function() {
        if (uv1Missing) {
            elUV1.classList.remove('hidden');
        } else {
            elUV1.classList.add('hidden');
        }
    });


    // track entities model assets loading state to re-bake
    var entityAssetLoading = { };
    var rebakeEntity = function(entity) {
        var receive = entity.get('components.model.lightMapReceive');
        if (! receive)
            return;

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

        setTimeout(function() {
            // TODO
            // trigger entity re-baking
        }, 0);
    };

    editor.once('viewport:load', function() {
        app = editor.call('viewport:framework');

        // bake once all assets are loaded on first time-load
        var loadingAssets = { };
        var onLoadStart = function(asset) {
            loadingAssets[asset.id] = true;
            asset.once('load', function() {
                delete loadingAssets[asset.id];

                if (Object.keys(loadingAssets).length === 0) {
                    app.assets.off('load:start', onLoadStart);
                    editor.once('viewport:update', function() {
                        editor.call('lightMapper:bake');
                    });
                }
            });
        };
        app.assets.on('load:start', onLoadStart);

        // re-bake on scene switches
        editor.on('scene:load', function() {
            // needs to wait 3 frames
            // before it is safe to re-bake
            // don't ask why :D
            editor.once('viewport:update', function() {
                editor.once('viewport:update', function() {
                    editor.once('viewport:update', function() {
                        editor.call('lightMapper:bake');
                    });
                });
            });
        });
    });

    editor.on('entities:add', function(entity) {
        rebakeEntity(entity);
    });
});


