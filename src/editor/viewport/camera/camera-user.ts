editor.once('load', () => {
    editor.on('entities:add:entity', (entity) => {
        if (entity.get('components.camera')) {
            editor.call('camera:add', entity.entity);
        }

        entity.on('components.camera:set', () => {
            // wait a frame for camera to be added
            // to the engine entity and then call camera:add
            requestAnimationFrame(() => {
                editor.call('camera:add', entity.entity);
            });
        });

        entity.on('components.camera:unset', () => {
            editor.call('camera:remove', entity.entity);
        });

        entity.once('destroy', () => {
            editor.call('camera:remove', entity.entity);
        });
    });
});
