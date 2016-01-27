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

        entity.history.enabled = true;
    });
});
