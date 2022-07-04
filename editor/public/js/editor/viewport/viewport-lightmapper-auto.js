editor.once('load', function () {
    'use strict';

    const app = editor.call('viewport:app');
    if (!app) return; // webgl not available

    let autoBake = false;

    // rebake the scene
    const rebake = (() => {
        const entSet = new Set();
        const timeDelay = 250;
        let timeoutId = null;

        editor.on('lightmapper:baked', () => {
            timeoutId = null;
        });

        return (entities) => {
            // collect entities
            if (entities) {
                entities.forEach((e) => entSet.add(e));
            }

            if (!timeoutId) {
                timeoutId = setTimeout(() => {
                    const entArray = entSet.size === 0 ? null : Array.from(entSet);
                    entSet.clear();
                    editor.call('lightmapper:bake', entArray);
                    editor.call('entities:shadows:update');
                }, timeDelay);
            }
        };
    })();

    const evtRebakeEntity = function () {
        if (autoBake) {
            rebake([this]);
        }
    };

    const evtRebakeLight = function () {
        if (autoBake && this.get('components.light.bake')) {
            rebake();
        }
    };

    const evtRebakeScene = function () {
        if (autoBake) {
            rebake();
        }
    };

    editor.method('lightmapper:auto', (value) => {
        value = !!value;

        if (value !== autoBake) {
            autoBake = value;
            editor.emit('lightmapper:auto', autoBake);
            evtRebakeScene();
        }
    });

    editor.emit('lightmapper:auto', autoBake);

    // bake once all assets are loaded on first time-load
    app.assets.on('load', (asset) => {
        evtRebakeScene();
    });

    // subscribe to model, light and scene changes
    // to do rebaking
    const fieldsLocal = [
        'components.model.lightmapped',
        'components.model.lightmapSizeMultiplier',
        'components.model.receiveShadows',
        'components.render.lightmapped',
        'components.render.lightmapSizeMultiplier',
        'components.render.receiveShadows'
    ];

    const fieldsLight = [
        'components.light.color',
        'components.light.intensity',
        'components.light.type',
        'components.light.castShadows',
        'components.light.shadowDistance',
        'components.light.shadowResolution',
        'components.light.shadowBias',
        'components.light.numCascades',
        'components.light.cascadeDistribution',
        'components.light.normalOffsetBias',
        'components.light.range',
        'components.light.innerConeAngle',
        'components.light.outerConeAngle',
        'components.light.falloffMode',
        'components.light.mask',
        'components.light.affectLightmapped',
        'components.light.bakeNumSamples',
        'components.light.bakeArea',
        'components.light.bakeDir',
        'components.light.vsmBlurMode',
        'components.light.vsmBlurSize',
        'components.light.cookieAsset',
        'components.light.cookieIntensity',
        'components.light.cookieFalloff',
        'components.light.cookieChannel',
        'components.light.cookieAngle',
        'components.light.cookieScale',
        'components.light.cookieOffset'
    ];

    const fieldsGlobal = [
        'enabled',
        'components.light.bake',
        'components.model.enabled',
        'components.model.type',
        'components.model.asset',
        'components.model.castShadowsLightmap',
        'components.render.enabled',
        'components.render.type',
        'components.render.asset',
        'components.render.castShadowsLightmap'
    ];

    editor.on('entities:add', function (entity) {
        // model
        for (let i = 0; i < fieldsLocal.length; i++) {
            entity.on(fieldsLocal[i] + ':set', evtRebakeEntity);
        }

        // light
        for (let i = 0; i < fieldsLight.length; i++)
            entity.on(fieldsLight[i] + ':set', evtRebakeLight);

        // global
        for (let i = 0; i < fieldsGlobal.length; i++)
            entity.on(fieldsGlobal[i] + ':set', evtRebakeScene);
    });

    editor.on('gizmo:translate:end', evtRebakeScene);
    editor.on('gizmo:rotate:end', evtRebakeScene);
    editor.on('gizmo:scale:end', evtRebakeScene);

    // auto-rebake on global lightmap setting changes

    const globals = [
        'lightmapSizeMultiplier',
        'lightmapMaxResolution',
        'lightmapMode',
        'lightmapFilterEnabled',
        'lightmapFilterRange',
        'lightmapFilterSmoothness',
        'ambientBake',
        'ambientBakeNumSamples',
        'ambientBakeSpherePart',
        'ambientBakeOcclusionBrightness',
        'ambientBakeOcclusionContrast'
    ];

    const sceneSettings = editor.call('sceneSettings');
    globals.forEach((key) => {
        sceneSettings.on(`render.${key}:set`, evtRebakeScene);
    });
});
