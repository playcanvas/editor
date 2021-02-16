editor.once('load', function () {
    'use sctrict';

    editor.on('entities:add:entity', function (entity) {
        if (entity.get('components.camera'))
            editor.call('camera:add', entity.entity);

        entity.on('components.camera:set', function () {
            editor.call('camera:add', entity.entity);
        });

        entity.on('components.camera:unset', function () {
            editor.call('camera:remove', entity.entity);
        });

        entity.once('destroy', function () {
            editor.call('camera:remove', entity.entity);
        });
    });
});
