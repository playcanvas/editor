editor.once('load', function () {
    'use strict';

    var getLayoutGroup = function (entityId) {
        var entity = editor.call('entities:get', entityId);
        return entity && entity.entity && entity.entity.layoutgroup;
    };

    var getLayoutChild = function (entityId) {
        var entity = editor.call('entities:get', entityId);
        return entity && entity.entity && entity.entity.layoutchild;
    };

    function forceSet(entity, path, value) {
        entity.set(path, value, false, false, true);
    }

    // Update the stored positions and sizes of entities that are children
    // of a layout group. This is necessary because if the user the disables
    // a layout group or moves its children out to a different part of the
    // graph, we still want the positions to stay the same after the page
    // is refreshed.
    editor.method('entities:layout:storeLayout', function (childEntityIds) {
        for (var i = 0; i < childEntityIds.length; ++i) {
            var entity = editor.call('entities:get', childEntityIds[i]);
            var historyEnabled = entity.history.enabled;
            entity.history.enabled = false;

            if (entity.entity.element) {
                forceSet(entity, 'components.element.width', entity.entity.element.width);
                forceSet(entity, 'components.element.height', entity.entity.element.height);

                var anchor = entity.entity.element.anchor;
                forceSet(entity, 'components.element.anchor', [anchor.x, anchor.y, anchor.z, anchor.w]);
            }

            var pos = entity.entity.getLocalPosition();
            forceSet(entity, 'position', [pos.x, pos.y, pos.z]);

            entity.history.enabled = historyEnabled;
        }
    });

    // return true if the entity's properties are controlled by a layout group parent
    editor.method('entities:layout:isUnderControlOfLayoutGroup', function (entity) {
        var layoutGroup = getLayoutGroup(entity.get('parent'));
        var isElement = entity.has('components.element');
        var exludedFromLayout = entity.get('components.layoutchild.excludeFromLayout');

        var isControlledByLayoutGroup = layoutGroup && layoutGroup.enabled && !exludedFromLayout;

        return isElement && isControlledByLayoutGroup;
    });

    editor.method('entities:layout:scheduleReflow', function (entityId) {
        pc.app.systems.layoutgroup.scheduleReflow(getLayoutGroup(entityId));
    });
});
