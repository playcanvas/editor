editor.once('load', function() {
    'use strict'

    editor.on('entities:add', function(entity) {
        setTimeout(function() {
            entity.history.enabled = false;

            // components

            // light
            if (entity.has('components.light')) {
                // bake
                if (! entity.has('components.light.bake'))
                    entity.set('components.light.bake', false);

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
            }

            // model
            if(entity.has('components.model')) {
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

            entity.history.enabled = true;
        }, 0);
    });
});
