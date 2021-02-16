editor.once('load', function () {
    'use strict';

    // An index where the key is the guid
    // of a child entity and the value is the guid of
    // a parent entity
    var childToParent = {};


    // An index where the key is the guid of
    // a deleted entity and the value is the JSON
    // representation of the entity at the time when
    // it was deleted. Used to re-create entities from
    // this cache instead of re-creating it from scratch
    var deletedCache = {};

    // Attach event listeners on a new entity.
    // Maintains the childToParent index
    editor.on('entities:add', function (entity) {
        var children = entity.get('children');
        for (let i = 0; i < children.length; i++)
            childToParent[children[i]] = entity.get('resource_id');

        entity.on('children:insert', function (value) {
            childToParent[value] = entity.get('resource_id');
        });
        entity.on('children:remove', function (value) {
            delete childToParent[value];
        });
    });

    /**
     * Updates entity references to the old entity to point to the new entity (which could also be null)
     *
     * @param {object} entityReferencesMap - See addEntity
     * @param {string} oldValue - The resource id that we want to replace
     * @param {string} newValue - The new resource id that we want our references to point to
     */
    var updateEntityReferenceFields = function (entityReferencesMap, oldValue, newValue) {
        var referencesToThisEntity = entityReferencesMap[oldValue];
        if (! referencesToThisEntity) return;

        referencesToThisEntity.forEach(function (reference) {
            var sourceEntity = editor.call('entities:get', reference.sourceEntityGuid);
            if (! sourceEntity) return;

            var prevHistory = sourceEntity.history.enabled;
            sourceEntity.history.enabled = false;
            sourceEntity.set('components.' + reference.componentName + '.' + reference.fieldName, newValue);
            sourceEntity.history.enabled = prevHistory;
        });
    };

    /**
     * Adds an entity to the scene.
     *
     * @param {Observer} entity - The entity
     * @param {Observer} parent - The parent of the entity
     * @param {boolean} select - Whether to select the new entity after it's added
     * @param {number} ind - The index in the parent's children array where we want to insert the entity
     * @param {object} entityReferencesMap - A dictionary holding references to entities
     * that need to be updated if we undo adding this entity. The format of this object looks like so:
     * targetResourceId: {
     *   sourceEntityGuid: GUID,
     *   componentName: String,
     *   fieldName: String
     * }
     */
    var addEntity = function (entity, parent, select, ind, entityReferencesMap) {
        entityReferencesMap = entityReferencesMap || {};

        childToParent[entity.get('resource_id')] = parent.get('resource_id');

        var children = entity.get('children');
        if (children.length)
            entity.set('children', []);

        // manually add ObserverSync to entity before calling entities:add so that we can
        // disable it. We need to disable it before adding the entity to the scene because
        // some sharedb ops that might throw errors (mainly when the entity has script attributes).
        // Instead we call entities:add which will call any other handlers that might set data on the
        // entity and then we manually add it to the scene with realtime:scene:op with all its data in
        // one op.
        editor.call('entities:addObserverSync', entity);

        entity.sync.enabled = false;

        // call add event
        editor.call('entities:add', entity);

        // shareDb
        editor.call('realtime:scene:op', {
            p: ['entities', entity.get('resource_id')],
            oi: entity.json()
        });

        entity.sync.enabled = true;

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        if (select) {
            setTimeout(function () {
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', [entity]);
                editor.once('selector:change', function () {
                    editor.call('selector:history', true);
                });
            }, 0);
        }

        // add children too
        children.forEach(function (childIdOrData) {
            var data;

            // If we've been provided an id, we're re-creating children from the deletedCache
            if (typeof childIdOrData === 'string') {
                data = deletedCache[childIdOrData];
                if (!data) {
                    return;
                }
                // If we've been provided an object, we're creating children for a new entity
            } else if (typeof childIdOrData === 'object') {
                data = childIdOrData;
            } else {
                throw new Error('Unhandled childIdOrData format');
            }

            var child = new Observer(data);
            addEntity(child, entity, undefined, undefined, entityReferencesMap);
        });

        // Hook up any entity references which need to be pointed to this newly created entity
        // (happens when addEntity() is being called during the undoing of a deletion). In order
        // to force components to respond to the setter call even when they are running in other
        // tabs or in the Launch window, we unfortunately have to use a setTimeout() hack :(
        var guid = entity.get('resource_id');

        // First set all entity reference fields targeting this guid to null
        updateEntityReferenceFields(entityReferencesMap, guid, null);
        setTimeout(function () {
            // Then update the same fields to target the guid again
            updateEntityReferenceFields(entityReferencesMap, guid, guid);
        }, 0);

        if (entity.get('__postCreationCallback')) {
            entity.get('__postCreationCallback')(entity);
        }
    };

    /**
     * Removes an entity from the scene
     *
     * @param {Observer} entity - The entity
     * @param {object} entityReferencesMap - Holds references to entities that need to be updated when
     * this entity is removed. See addEntity for more.
     * @param forgetDeletedEntities
     */
    var removeEntity = function (entity, entityReferencesMap, forgetDeletedEntities) {
        entityReferencesMap = entityReferencesMap || {};
        if (!forgetDeletedEntities) {
            deletedCache[entity.get('resource_id')] = entity.json();
        }

        // Nullify any entity references which currently point to this guid
        updateEntityReferenceFields(entityReferencesMap, entity.get('resource_id'), null);

        // remove children
        entity.get('children').forEach(function (child) {
            var entity = editor.call('entities:get', child);
            if (!entity)
                return;

            removeEntity(entity, entityReferencesMap, forgetDeletedEntities);
        });

        if (editor.call('selector:type') === 'entity' && editor.call('selector:items').indexOf(entity) !== -1) {
            editor.call('selector:history', false);
            editor.call('selector:remove', entity);
            editor.once('selector:change', function () {
                editor.call('selector:history', true);
            });
        }

        // remove from parent
        var parentId = childToParent[entity.get('resource_id')];
        if (parentId) {
            var parent = editor.call('entities:get', parentId);
            if (parent) {
                parent.history.enabled = false;
                parent.removeValue('children', entity.get('resource_id'));
                parent.history.enabled = true;
            }
        }

        // call remove method
        editor.call('entities:remove', entity);

        // sharedb
        editor.call('realtime:scene:op', {
            p: ['entities', entity.get('resource_id')],
            od: {}
        });
    };

    // Expose methods
    editor.method('entities:addEntity', addEntity);
    editor.method('entities:removeEntity', removeEntity);

    /**
     * Gets the resource id of the parent of the entityh with the specified resource id.
     *
     * @param {string} childResourceId - The resource id of an entity
     * @returns {string} The resource id of the entity's parent
     */
    editor.method('entities:getParentResourceId', function (childResourceId) {
        return childToParent[childResourceId];
    });

    /**
     * Updates the childToParent map with a new child-parent resource id pair. Used
     * from other methods that edit the scene hierarchy.
     *
     * @param {string} childResourceId - The resource id of the child entity
     * @param {string} parentResourceId - The resource id of the parent entity
     */
    editor.method('entities:updateChildToParentIndex', function (childResourceId, parentResourceId) {
        childToParent[childResourceId] = parentResourceId;
    });

    /**
     * Gets an entity from the deleted cache
     *
     * @returns {Observer} The deleted entity
     */
    editor.method('entities:getFromDeletedCache', function (resourceId) {
        return deletedCache[resourceId];
    });
});
