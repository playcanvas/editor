editor.once('load', function () {
    editor.on('entities:add:entity', function (entity) {
        if (entity.get('components.camera'))
            editor.call('camera:add', entity.entity);

        entity.on('components.camera:set', function () {
            // wait a frame for camera to be added
            // to the engine entity and then call camera:add
            requestAnimationFrame(() => {
                editor.call('camera:add', entity.entity);
            });
        });

        entity.on('components.camera:unset', function () {
            editor.call('camera:remove', entity.entity);
        });

        entity.once('destroy', function () {
            editor.call('camera:remove', entity.entity);
        });
    });
});
