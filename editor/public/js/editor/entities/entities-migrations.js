editor.once('load', function() {
    'use strict'

    editor.on('entities:add', function(entity) {
        setTimeout(function() {
            entity.history.enabled = false;

            // tags
            if (! entity.has('tags'))
                entity.set('tags', [ ]);

            // components

            // camera
            if (entity.has('components.camera')) {
                // frustumCulling
                if (! entity.has('components.camera.frustumCulling'))
                    entity.set('components.camera.frustumCulling', false);
            }

            // light
            if (entity.has('components.light')) {
                // isStatic
                if (! entity.has('components.light.isStatic'))
                    entity.set('components.light.isStatic', false);

                // bake
                if (! entity.has('components.light.bake'))
                    entity.set('components.light.bake', false);

                // bakeDir
                if (! entity.has('components.light.bakeDir'))
                    entity.set('components.light.bakeDir', true);

                // affectDynamic
                if (! entity.has('components.light.affectDynamic'))
                    entity.set('components.light.affectDynamic', true);

                // affectLightmapped
                if (! entity.has('components.light.affectLightmapped'))
                    entity.set('components.light.affectLightmapped', false);

                // shadowUpdateMode
                var shadowUpdateMode = entity.get('components.light.shadowUpdateMode');
                if (shadowUpdateMode === null || isNaN(shadowUpdateMode))
                    entity.set('components.light.shadowUpdateMode', pc.SHADOWUPDATE_REALTIME);

                // shadowType
                if (! entity.has('components.light.shadowType'))
                    entity.set('components.light.shadowType', 0);

                // vsmBlurMode
                if (! entity.has('components.light.vsmBlurMode'))
                    entity.set('components.light.vsmBlurMode', 0);

                // vsmBlurSize
                if (! entity.has('components.light.vsmBlurSize'))
                    entity.set('components.light.vsmBlurSize', 5);

                // vsmBias
                if (! entity.has('components.light.vsmBias'))
                    entity.set('components.light.vsmBias', 0.01 * 0.25);

                // cookieAsset
                if (! entity.has('components.light.cookieAsset'))
                    entity.set('components.light.cookieAsset', null);

                // cookieIntensity
                if (! entity.has('components.light.cookieIntensity'))
                    entity.set('components.light.cookieIntensity', 1.0);

                // cookieFalloff
                if (! entity.has('components.light.cookieFalloff'))
                    entity.set('components.light.cookieFalloff', true);

                // cookieChannel
                if (! entity.has('components.light.cookieChannel'))
                    entity.set('components.light.cookieChannel', 'rgb');

                // cookieAngle
                if (! entity.has('components.light.cookieAngle'))
                    entity.set('components.light.cookieAngle', 0);

                // cookieScale
                if (! entity.has('components.light.cookieScale'))
                    entity.set('components.light.cookieScale', [ 1.0, 1.0 ]);

                // cookieOffset
                if (! entity.has('components.light.cookieOffset'))
                    entity.set('components.light.cookieOffset', [ 0.0, 0.0 ]);
            }

            // model
            if(entity.has('components.model')) {
                // isStatic
                if (! entity.has('components.model.isStatic'))
                    entity.set('components.model.isStatic', false);

                // lightmapped
                if (! entity.has('components.model.lightmapped'))
                    entity.set('components.model.lightmapped', false);

                // castShadowsLightmap
                if (! entity.has('components.model.castShadowsLightmap'))
                    entity.set('components.model.castShadowsLightmap', true);

                // lightmapSizeMultiplier
                if (! entity.has('components.model.lightmapSizeMultiplier'))
                    entity.set('components.model.lightmapSizeMultiplier', 1.0);
            }

            // element
            if (entity.has('components.element')) {
                var color = entity.get('components.element.color');
                var opacity = 1.0;
                if (color.length > 3) {
                    opacity = color[3];
                    entity.set('components.element.color', [color[0], color[1], color[2]]);
                }

                if (! entity.has('components.element.opacity')) {
                    entity.set('components.element.opacity', opacity);
                }
            }

            entity.history.enabled = true;
        }, 0);
    });
});
