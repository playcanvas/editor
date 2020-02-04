editor.once('load', function () {
    'use strict';

    var createNewEntityData = function (defaultData, parentResourceId) {
        var entityData = {
            name: defaultData.name || 'New Entity',
            tags: [],
            enabled: true,
            resource_id: pc.guid.create(),
            parent: parentResourceId,
            children: [],
            position: defaultData.position || [0, 0, 0],
            rotation: defaultData.rotation || [0, 0, 0],
            scale: defaultData.scale || [1, 1, 1],
            components: defaultData.components || {},
            __postCreationCallback: defaultData.postCreationCallback
        };

        if (defaultData.children) {
            for (var i = 0; i < defaultData.children.length; i++) {
                var childEntityData = createNewEntityData(defaultData.children[i], entityData.resource_id);
                entityData.children.push(childEntityData);
            }
        }

        return entityData;
    };

    /**
     * Creates a new entity.
     * @param {Object} defaultData The default entity data. This can also define a postCreationCallback argument at each level, which is
     * designed for cases where composite entity hierarchies need some post-processing, and the
     * post processing needs to be done both in the case of initial creation and also the case
     * of undo/redo.
     * @returns {Observer} The new entity
     */
    editor.method('entities:new', function (defaultData) {
        // get root if parent is null
        defaultData = defaultData || {};
        var parent = defaultData.parent || editor.call('entities:root');

        var data = createNewEntityData(defaultData, parent.get('resource_id'));

        var selectorType, selectorItems;

        if (!defaultData.noHistory) {
            selectorType = editor.call('selector:type');
            selectorItems = editor.call('selector:items');
            if (selectorType === 'entity') {
                for (var i = 0; i < selectorItems.length; i++)
                    selectorItems[i] = selectorItems[i].get('resource_id');
            }
        }

        // create new Entity data
        var entity = new Observer(data);
        editor.call('entities:addEntity', entity, parent, !defaultData.noSelect, defaultData.index);

        // history
        if (!defaultData.noHistory) {
            var resourceId = entity.get('resource_id');
            var parentId = parent.get('resource_id');

            editor.call('history:add', {
                name: 'new entity ' + resourceId,
                undo: function () {
                    var entity = editor.call('entities:get', resourceId);
                    if (!entity)
                        return;

                    editor.call('entities:removeEntity', entity);

                    if (selectorType === 'entity' && selectorItems.length) {
                        var items = [];
                        for (var i = 0; i < selectorItems.length; i++) {
                            var item = editor.call('entities:get', selectorItems[i]);
                            if (item)
                                items.push(item);
                        }

                        if (items.length) {
                            editor.call('selector:history', false);
                            editor.call('selector:set', selectorType, items);
                            editor.once('selector:change', function () {
                                editor.call('selector:history', true);
                            });
                        }
                    }
                },
                redo: function () {
                    var parent = editor.call('entities:get', parentId);
                    if (!parent)
                        return;

                    var entity = new Observer(data);
                    editor.call('entities:addEntity', entity, parent, true);
                }
            });
        }

        return entity;
    });
});
