editor.once('load', function() {
    'use strict'

    editor.on('entities:add', function(entity) {
        entity.history.enabled = false;

        // components

        // light
        if (entity.has('components.light')) {
            // affectDynamic
            if (! entity.has('components.light.affectDynamic')) {
                entity.set('components.light.affectDynamic', true);
            }
        }

        // model
        if(entity.has('components.model')) {
            // lightmapSizeMultiplier
            if (! entity.has('components.model.lightmapSizeMultiplier')) {
                entity.set('components.model.lightmapSizeMultiplier', 1.0);
            }
        }

        entity.history.enabled = true;
    });
});
