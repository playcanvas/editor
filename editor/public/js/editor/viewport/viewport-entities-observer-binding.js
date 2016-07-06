editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:framework');

    editor.on('entities:add', function (obj) {
        // subscribe to changes
        obj.on('*:set', function(path, value) {
            var entity = obj.entity;
            if (! entity)
                return;

            if (path === 'name') {
                entity.setName(obj.get('name'));

            } else if (path.startsWith('position')) {
                entity.setLocalPosition(obj.get('position.0'), obj.get('position.1'), obj.get('position.2'));

            } else if (path.startsWith('rotation')) {
                entity.setLocalEulerAngles(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2'));

            } else if (path.startsWith('scale')) {
                entity.setLocalScale(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2'));

            } else if (path.startsWith('enabled')) {
                entity.enabled = obj.get('enabled');

            } else if (path.startsWith('parent')) {
                var parent = editor.call('entities:get', obj.get('parent'));
                if (parent && parent.entity)
                    entity.reparent(parent.entity);
            } else if (path === 'components.model.type' && value === 'asset') {
                // WORKAROUND
                // entity deletes asset when switching to primitive, restore it
                // do this in a timeout to allow the model type to change first
                setTimeout(function () {
                    var assetId = obj.get('components.model.asset');
                    if (assetId)
                        entity.model.asset = assetId;
                });
            }

            // render
            editor.call('viewport:render');
        });

        var reparent = function (child, index) {
            var childEntity = editor.call('entities:get', child);
            if (childEntity && childEntity.entity && obj.entity) {
                childEntity.entity.reparent(obj.entity, index);
            }
        };

        obj.on('children:insert', reparent);
        obj.on('children:move', reparent);

        obj.on('destroy', function () {
            if (obj.entity) {
                obj.entity.destroy();
                editor.call('viewport:render');
            }
        });
    });

    editor.on('entities:remove', function (obj) {
        var entity = obj.entity;
        if (! entity)
            return;

        entity.destroy();
        editor.call('viewport:render');
    });
});
