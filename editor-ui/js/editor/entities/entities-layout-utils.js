editor.once('load', function () {
    'use strict';

    var getLayoutGroup = function (entityId) {
        var entity = editor.call('entities:get', entityId);
        return entity && entity.entity && entity.entity.layoutgroup;
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
        for (let i = 0; i < childEntityIds.length; ++i) {
            var entity = editor.call('entities:get', childEntityIds[i]);
            var historyEnabled = entity.history.enabled;
            entity.history.enabled = false;

            if (entity.entity.element) {
                forceSet(entity, 'components.element.width', entity.entity.element.width);
                forceSet(entity, 'components.element.height', entity.entity.element.height);

                var anchor = entity.entity.element.anchor;
                forceSet(entity, 'components.element.anchor', [anchor.x, anchor.y, anchor.z, anchor.w]);

                var margin = entity.entity.element.margin;
                forceSet(entity, 'components.element.margin', [margin.x, margin.y, margin.z, margin.w]);
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

    // build the layout data block used by restoreElementChildrenLayouts
    editor.method('entities:layout:getElementChildrenLayouts', function (childEntityIds) {
        const childrenLayouts = {};
        for (let i = 0; i < childEntityIds.length; ++i) {
            var entity = editor.call('entities:get', childEntityIds[i]);
            var historyEnabled = entity.history.enabled;
            entity.history.enabled = false;

            childrenLayouts[i] = {};
            if (entity.entity.element) {
                childrenLayouts[i].width = entity.entity.element.width;
                childrenLayouts[i].height = entity.entity.element.height;
                childrenLayouts[i].anchor = entity.entity.element.anchor.clone();
                childrenLayouts[i].margin = entity.entity.element.margin.clone();
            }
            childrenLayouts[i].position = entity.entity.getLocalPosition().clone();

            entity.history.enabled = historyEnabled;
        }
        return childrenLayouts;
    });

    // consume a layout data block built on getElementChildrenLayouts, applying back to the child entities
    // note that, similar to 'entities:layout:storeLayout', this method also force-updates the stored layout data
    editor.method('entities:layout:restoreElementChildrenLayouts', function (childEntityIds, childrenLayouts) {
        for (let i = 0; i < childEntityIds.length; ++i) {
            var entity = editor.call('entities:get', childEntityIds[i]);
            var historyEnabled = entity.history.enabled;
            entity.history.enabled = false;

            var childData = childrenLayouts[i];
            if (entity.entity.element) {
                forceSet(entity, 'components.element.width', childData.width);
                forceSet(entity, 'components.element.height', childData.height);

                var anchor = childData.anchor;
                forceSet(entity, 'components.element.anchor', [anchor.x, anchor.y, anchor.z, anchor.w]);

                var margin = childData.margin;
                forceSet(entity, 'components.element.margin', [margin.x, margin.y, margin.z, margin.w]);
            }
            var pos = childData.position;
            forceSet(entity, 'position', [pos.x, pos.y, pos.z]);

            entity.history.enabled = historyEnabled;
        }
    });
});
