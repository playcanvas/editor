editor.once('load', function () {
    'use strict';

    const MAX_JOB_LENGTH = 8;

    const jobsInProgress = {};

    const projectUserSettings = editor.call('settings:projectUser');


    // When entities are deleted, we need to do some work to identify references to the
    // deleted entities held by other entities in the graph. For example, if entityA has
    // a component that holds a reference to entityB and entityB is deleted, we should
    // nullify the reference so that entityA's component does not retain or try to access
    // the deleted entity. Similarly, if the deletion is undone, we need to re-populate
    // the reference so that it points once again at entityB.
    //
    // To achieve this, we perform a quick scan of the graph whenever one or more entities
    // are deleted, to build a snapshot of the entity references at that time. The snapshot
    // (which is just a map) is then used for identifying all references to any of the deleted
    // entities, and these are set to null. If the deletion is subsequently undone, the map
    // is used again in order to set all references back to the correct entity guids.
    var recursivelySearchForEntityReferences = function (sourceEntity, entityReferencesMap) {
        if (!sourceEntity) return;

        var componentNames = Object.keys(sourceEntity.get('components') || {});
        var i, j;

        for (i = 0; i < componentNames.length; i++) {
            var componentName = componentNames[i];
            var entityFields = editor.call('components:getFieldsOfType', componentName, 'entity');

            for (j = 0; j < entityFields.length; j++) {
                var fieldName = entityFields[j];
                var targetEntityGuid = sourceEntity.get('components.' + componentName + '.' + fieldName);

                entityReferencesMap[targetEntityGuid] = entityReferencesMap[targetEntityGuid] || [];
                entityReferencesMap[targetEntityGuid].push({
                    sourceEntityGuid: sourceEntity.get('resource_id'),
                    componentName: componentName,
                    fieldName: fieldName
                });
            }
        }

        var children = sourceEntity.get('children');

        if (children.length > 0) {
            for (i = 0; i < children.length; i++) {
                recursivelySearchForEntityReferences(editor.call('entities:get', children[i]), entityReferencesMap);
            }
        }

        // TODO: this doesn't seem to work for entity script attributes
    };

    function deleteInBackend(entityIds) {
        const jobId = pc.guid.create().substring(0, MAX_JOB_LENGTH);

        jobsInProgress[jobId] = true;

        const taskData = {
            projectId: config.project.id,
            branchId: config.self.branch.id,
            sceneId: config.scene.uniqueId,
            jobId: jobId,
            entities: entityIds
        };

        editor.call('realtime:send', 'pipeline', {
            name: 'entities-delete',
            data: taskData
        });

        editor.call('status:job', jobId, 1);
    }

    editor.method('entities:deleteInBackend', deleteInBackend);

    editor.on('messenger:entity.delete', data => {
        if (jobsInProgress.hasOwnProperty(data.job_id)) {
            // clear pending job
            editor.call('status:job', data.job_id);
            delete jobsInProgress[data.job_id];
        }
    });

    // Gets the count of the entities and their children
    function getTotalEntityCount(entities) {
        let count = entities.length;

        for (let i = 0; i < entities.length; i++) {
            if (entities[i]) {
                const children = entities[i].get('children');
                count += getTotalEntityCount(children.map(id => editor.call('entities:get', id)));
            }
        }

        return count;
    }

    /**
     * Deletes the specified entities
     *
     * @param {Observer[]} entities - The entities to delete
     */
    editor.method('entities:delete', function (entities) {
        var records = [];
        var entitiesToDelete = [];
        var i;
        var parent;

        // index entities
        var resourceIds = {};
        for (i = 0; i < entities.length; i++) {
            resourceIds[entities[i].get('resource_id')] = entities[i];
        }

        // find out if entity has ancestor
        for (i = 0; i < entities.length; i++) {
            var child = false;
            parent = editor.call('entities:getParentResourceId', entities[i].get('resource_id'));

            while (!child && parent) {
                if (resourceIds[parent]) {
                    child = true;
                } else {
                    parent = editor.call('entities:getParentResourceId', parent);
                }
            }

            if (!child) {
                entitiesToDelete.push(entities[i]);
            }
        }

        // delete only top level entities
        entities = entitiesToDelete;

        // if we have a lot of entities delete in the backend
        if (editor.call('users:hasFlag', 'hasPipelineEntityCopy') &&
            projectUserSettings.get('editor.pipeline.entityCopy') &&
            getTotalEntityCount(entitiesToDelete) > COPY_OR_DELETE_IN_BACKEND_LIMIT) {

            editor.call(
                'picker:confirm',
                'Deleting this many entities is not undoable. Are you sure?', () => {
                    deleteInBackend(entitiesToDelete.map(entity => entity.get('resource_id')));
                }
            );

            return;
        }

        for (i = 0; i < entities.length; i++) {
            var resourceId = entities[i].get('resource_id');
            var parentId = editor.call('entities:getParentResourceId', resourceId);
            var ind;
            if (parentId) {
                parent = editor.call('entities:get', parentId);
                if (parent) {
                    ind = parent.get('children').indexOf(resourceId);
                }
            }

            records.push({
                resourceId: resourceId,
                parentId: parentId,
                ind: ind,
                data: entities[i].json()
            });
        }

        // Build a map of all entity reference properties in the graph. This is
        // effectively a snapshot of the entity references as they were at the point of deletion,
        // so that they can be re-constituted later if the deletion is undone.
        var entityReferencesMap = {};
        recursivelySearchForEntityReferences(editor.call('entities:root'), entityReferencesMap);

        // remove the entities from the scene
        for (i = 0; i < entities.length; i++) {
            editor.call('entities:removeEntity', entities[i], entityReferencesMap);
        }

        // sort records by index
        // so that entities are re-added
        // in the correct order in undo
        records.sort(function (a, b) {
            return a.ind - b.ind;
        });

        // add history action
        editor.call('history:add', {
            name: 'delete entities',
            undo: function () {
                var entities = [];
                for (let i = 0, len = records.length; i < len; i++) {
                    var parent = editor.call('entities:get', records[i].parentId);
                    if (!parent)
                        return;

                    var entity = new Observer(records[i].data);
                    entities.push(entity);
                    editor.call('entities:addEntity', entity, parent, false, records[i].ind, entityReferencesMap);
                }

                // select re-added entities
                setTimeout(function () {
                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', entities);
                    editor.once('selector:change', function () {
                        editor.call('selector:history', true);
                    });
                }, 0);
            },
            redo: function () {
                for (let i = 0, len = records.length; i < len; i++) {
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (!entity)
                        return;

                    editor.call('entities:removeEntity', entity, entityReferencesMap);
                }
            }
        });
    });
});
