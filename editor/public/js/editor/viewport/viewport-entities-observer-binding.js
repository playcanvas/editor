editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');
    if (! app) return; // webgl not available

    editor.on('entities:add', function (obj) {
        // subscribe to changes
        obj.on('*:set', function(path, value) {
            var entity = obj.entity;
            if (! entity)
                return;

            if (path === 'name') {
                entity.name = obj.get('name');

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
                if (parent && parent.entity && entity.parent !== parent.entity)
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
                var oldParent = childEntity.entity.parent;

                if (oldParent)
                    oldParent.removeChild(childEntity.entity);

                // skip any graph nodes
                if (index > 0) {
                    var children = obj.entity.children;
                    for (var i = 0, len = children.length; i < len && index > 0; i++) {
                        if (children[i] instanceof pc.Entity) {
                            index--;
                        }
                    }

                    index = i;
                }

                // re-insert
                obj.entity.insertChild(childEntity.entity, index);

                // persist the positions and sizes of elements if they were previously
                // under control of a layout group but have now been reparented
                if (oldParent.layoutgroup) {
                    editor.call('entities:layout:storeLayout', [childEntity.entity.getGuid()]);
                }
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
