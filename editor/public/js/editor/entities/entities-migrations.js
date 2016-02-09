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
