editor.once('load', function() {
    'use strict';

    // index
    var childToParent = { };

    var deletedCache = { };

    // add
    editor.on('entities:add', function(entity) {
        var children = entity.get('children');
        for(var i = 0; i < children.length; i++) {
            childToParent[children[i]] = entity.get('resource_id');
        }

        entity.on('children:insert', function(value) {
            childToParent[value] = this.get('resource_id');
        });
        entity.on('children:remove', function(value) {
            delete childToParent[value];
        });
    });

    editor.method('entities:childToParent', function(child, parent) {
        childToParent[child.get('resource_id')] = parent.get('resource_id');
    });


    // new entity
    editor.method('entities:new', function (raw) {
        // get root if parent is null
        raw = raw || { };
        var parent = raw.parent || editor.call('entities:root');

        var data = {
            name: raw.name || 'New Entity',
            tags: [ ],
            enabled: true,
            resource_id: pc.guid.create(),
            parent: parent.get('resource_id'),
            children: [ ],
            position: raw.position || [ 0, 0, 0 ],
            rotation: raw.rotation || [ 0, 0, 0 ],
            scale: raw.scale || [ 1, 1, 1 ],
            components: raw.components || { }
        };

        var selectorType, selectorItems;

        if (! raw.noHistory) {
            var selectorType = editor.call('selector:type');
            var selectorItems = editor.call('selector:items');
            if (selectorType === 'entity') {
                for(var i = 0; i < selectorItems.length; i++)
                    selectorItems[i] = selectorItems[i].get('resource_id');
            }
        }

        // create new Entity data
        var entity = new Observer(data);
        childToParent[entity.get('resource_id')] = parent.get('resource_id');
        addEntity(entity, parent, ! raw.noSelect);

        // history
        if (! raw.noHistory) {
            var resourceId = entity.get('resource_id');
            var parentId = parent.get('resource_id');

            editor.call('history:add', {
                name: 'new entity ' + resourceId,
                undo: function() {
                    var entity = editor.call('entities:get', resourceId);
                    if (! entity)
                        return;

                    removeEntity(entity);

                    if (selectorType === 'entity' && selectorItems.length) {
                        var items = [ ];
                        for(var i = 0; i < selectorItems.length; i++) {
                            var item = editor.call('entities:get', selectorItems[i]);
                            if (item)
                                items.push(item);
                        }

                        if (items.length) {
                            editor.call('selector:history', false);
                            editor.call('selector:set', selectorType, items);
                            editor.once('selector:change', function() {
                                editor.call('selector:history', true);
                            });
                        }
                    }
                },
                redo: function() {
                    var parent = editor.call('entities:get', parentId);
                    if (! parent)
                        return;

                    var entity = new Observer(data);
                    childToParent[entity.get('resource_id')] = parent.get('resource_id');
                    addEntity(entity, parent, true);
                }
            });
        }

        return entity;
    });

    var addEntity = function(entity, parent, select, ind) {
        var children = entity.get('children');
        if (children.length)
            entity.set('children', [ ]);

        // call add event
        editor.call('entities:add', entity);

        // sharejs
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        if (select) {
            setTimeout(function() {
                editor.call('selector:history', false);
                editor.call('selector:set', 'entity', [ entity ]);
                editor.once('selector:change', function() {
                    editor.call('selector:history', true);
                });
            }, 0);
        }

        // add children too
        children.forEach(function(childId) {
            var data = deletedCache[childId];
            if (! data)
                return;

            var child = new Observer(data);
            childToParent[child.get('resource_id')] = entity.get('resource_id');
            addEntity(child, entity);
        });
    };

    var removeEntity = function(entity) {
        deletedCache[entity.get('resource_id')] = entity.json();

        // remove children
        entity.get('children').forEach(function (child) {
            var entity = editor.call('entities:get', child);
            if (! entity)
                return;

            removeEntity(entity);
        });

        if (editor.call('selector:type') === 'entity' && editor.call('selector:items').indexOf(entity) !== -1) {
            editor.call('selector:history', false);
            editor.call('selector:remove', entity);
            editor.once('selector:change', function() {
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

        // sharejs
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            od: { }
        });
    };

    editor.method('entities:addEntity', addEntity);
    editor.method('entities:removeEntity', removeEntity);

    var duplicateEntity = function(entity, parent, ind) {
        var resourceId = entity.get('resource_id');
        var data = entity.json();
        var children = data.children;

        data.children = [ ];
        data.resource_id = pc.guid.create();
        data.parent = parent.get('resource_id');

        entity = new Observer(data);
        childToParent[entity.get('resource_id')] = parent.get('resource_id');

        // call add event
        editor.call('entities:add', entity);

        // sharejs
        editor.call('realtime:scene:op', {
            p: [ 'entities', entity.get('resource_id') ],
            oi: entity.json()
        });

        // this is necessary for the entity to be added to the tree view
        parent.history.enabled = false;
        parent.insert('children', entity.get('resource_id'), ind);
        parent.history.enabled = true;

        // add children too
        children.forEach(function(childId) {
            duplicateEntity(editor.call('entities:get', childId), entity);
        });

        return entity;
    };

    // duplicate entity
    editor.method('entities:duplicate', function (entities) {
        var root = editor.call('entities:root');
        var items = entities.slice(0);
        var entitiesNew = [ ];
        var entitiesNewData = [ ];
        var entitiesNewMeta = { };
        var ids = { };

        // make sure not duplicating root
        if (items.indexOf(root) !== -1)
            return;

        // build entities index
        for(var i = 0; i < items.length; i++) {
            var id = items[i].get('resource_id');

            ids[id] = {
                id: id,
                entity: items[i],
                parentId: childToParent[id],
                ind: editor.call('entities:get', childToParent[id]).get('children').indexOf(id)
            };
        }

        // filter children off
        var i = items.length;
        while(i--) {
            var item = ids[items[i].get('resource_id')];
            var parentId = item.parentId;

            while(parentId && parentId !== root.get('resource_id')) {
                if (ids[parentId]) {
                    items.splice(i, 1);
                    delete ids[item.id];
                    break;
                }
                parentId = childToParent[parentId];
            }
        }

        // sort by order index within parent
        items.sort(function(a, b) {
            return ids[b.get('resource_id')].ind - ids[a.get('resource_id')].ind;
        });

        // remember current selection
        var selectorType = editor.call('selector:type');
        var selectorItems = editor.call('selector:items');
        for(var i = 0; i < selectorItems.length; i++) {
            var item = selectorItems[i];
            if (selectorType === 'entity') {
                selectorItems[i] = {
                    type: 'entity',
                    id: item.get('resource_id')
                };
            } else if (selectorType === 'asset') {
                selectorItems[i] = { };
                if (selectorItems[i].get('type') === 'script') {
                    selectorItems[i].type = 'script';
                    selectorItems[i].id = item.get('filename');
                } else {
                    selectorItems[i].type = 'asset';
                    selectorItems[i].id = item.get('id');
                }
            }
        }

        // duplicate
        for(var i = 0; i < items.length; i++) {
            var entity = items[i];
            var id = entity.get('resource_id');
            var parent = editor.call('entities:get', childToParent[id]);
            var entityNew = duplicateEntity(entity, parent, ids[id].ind + 1);
            entitiesNew.push(entityNew);
            entitiesNewData.push(entityNew.json());
            entitiesNewMeta[entityNew.get('resource_id')] = {
                parentId: childToParent[id],
                ind: ids[id].ind
            };
        }

        // set new selection
        setTimeout(function() {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', entitiesNew);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }, 0);

        // add history action
        editor.call('history:add', {
            name: 'duplicate entities',
            undo: function() {
                // remove duplicated entities
                for(var i = 0; i < entitiesNewData.length; i++) {
                    var entity = editor.call('entities:get', entitiesNewData[i].resource_id);
                    if (! entity)
                        continue;

                    removeEntity(entity);
                }

                // restore selection
                if (selectorType) {
                    var items = [ ];
                    for(var i = 0; i < selectorItems.length; i++) {
                        var item;

                        if (selectorItems[i].type === 'entity') {
                            item = editor.call('entities:get', selectorItems[i].id);
                        } else if (selectorItems[i].type === 'asset') {
                            item = editor.call('assets:get', selectorItems[i].id);
                        } else if (selectorItems[i].type === 'script') {
                            item = editor.call('sourcefiles:get', selectorItems[i].id);
                        }

                        if (! item)
                            continue;

                        items.push(item);
                    }

                    if (items.length) {
                        editor.call('selector:history', false);
                        editor.call('selector:set', selectorType, items);
                        editor.once('selector:change', function() {
                            editor.call('selector:history', true);
                        });
                    }
                }
            },
            redo: function() {
                var entities = [ ];

                for(var i = 0; i < entitiesNewData.length; i++) {
                    var id = entitiesNewData[i].resource_id;
                    var meta = entitiesNewMeta[id];
                    if (! meta)
                        continue;

                    var parent = editor.call('entities:get', meta.parentId);
                    if (! parent)
                        continue;

                    var entity = new Observer(entitiesNewData[i]);
                    childToParent[id] = meta.parentId;
                    addEntity(entity, parent, true, meta.ind + 1);

                    entities.push(entity);
                }

                if (entities.length) {
                    setTimeout(function() {
                        editor.call('selector:history', false);
                        editor.call('selector:set', 'entity', entities);
                        editor.once('selector:change', function() {
                            editor.call('selector:history', true);
                        });
                    }, 0);
                }
            }
        });
    });

    // delete entity
    editor.method('entities:delete', function (items) {
        var records = [ ];
        var itemsToDelete = [ ];

        // index items
        var itemsIds = { };
        for(var i = 0; i < items.length; i++) {
            itemsIds[items[i].get('resource_id')] = items[i];
        }

        // find out if item has ancestor
        for(var i = 0; i < items.length; i++) {
            var child = false;
            var parent = childToParent[items[i].get('resource_id')];
            while(! child && parent) {
                if (itemsIds[parent]) {
                    child = true;
                } else {
                    parent = childToParent[parent]
                }
            }

            if (! child)
                itemsToDelete.push(items[i]);
        }

        // delete only non-childed items
        items = itemsToDelete;

        for(var i = 0; i < items.length; i++) {
            var resourceId = items[i].get('resource_id');
            var parentId = childToParent[resourceId];
            var ind;
            if (parentId) {
                var parent = editor.call('entities:get', parentId);
                if (parent)
                    ind = parent.get('children').indexOf(resourceId);
            }

            records.push({
                resourceId: resourceId,
                parentId: parentId,
                ind: ind,
                data: items[i].json()
            });
        }

        for(var i = 0; i < items.length; i++) {
            removeEntity(items[i]);
        }

        editor.call('history:add', {
            name: 'delete entities',
            undo: function() {
                var items = [ ];
                var i = records.length;
                while(i--) {
                    var parent = editor.call('entities:get', records[i].parentId);
                    if (! parent)
                        return;

                    var entity = new Observer(records[i].data);
                    items.push(entity);
                    childToParent[entity.get('resource_id')] = parent.get('resource_id');
                    addEntity(entity, parent, false, records[i].ind);
                }

                setTimeout(function() {
                    editor.call('selector:history', false);
                    editor.call('selector:set', 'entity', items);
                    editor.once('selector:change', function() {
                        editor.call('selector:history', true);
                    });
                }, 0);
            },
            redo: function() {
                for(var i = 0; i < records.length; i++) {
                    var entity = editor.call('entities:get', records[i].resourceId);
                    if (! entity)
                        return;

                    removeEntity(entity);
                }
            }
        });
    });

    // copy entity to local storage
    editor.method('entities:copy', function (entity) {
        var data = {
            project: config.project.id,
            hierarchy: {}
        };

        // gather all dependencies of this entity
        var gatherDependencies = function (entity) {
            var resourceId = entity.get('resource_id');
            if (! data.hierarchy[resourceId]) {
                data.hierarchy[resourceId] = entity.json();
            }

            var children = entity.get('children');
            for (var i = 0; i < children.length; i++) {
                gatherDependencies(editor.call('entities:get', children[i]));
            }
        };

        gatherDependencies(entity);

        // remove parent from copied entity
        data.hierarchy[entity.get('resource_id')].parent = null;

        // save to local storage
        editor.call('entities:clipboard:set', data);
    });

    // paste entity in local storage under parent
    editor.method('entities:paste', function (parent) {
        // parse data from local storage
        var data = editor.call('entities:clipboard:get');
        if (! data)
            return;

        // check it's the same project
        if (data.project !== config.project.id)
            return;

        // change resource ids
        var mapping = {};

        var remapResourceIds = function (entity) {
            var resourceId = entity.get('resource_id');

            // create new resource id for entity
            if (! mapping[resourceId]) {
                mapping[resourceId] = pc.guid.create();
            }

            var newResourceId = mapping[resourceId];
            entity.set('resource_id', newResourceId);

            // set new resource id for parent
            var parentId = entity.get('parent');
            if (parentId) {
                if (! mapping[parentId]) {
                    mapping[parentId] = pc.guid.create();
                }

                entity.set('parent', mapping[parentId]);
            } else {
                entity.set('parent', parent.get('resource_id'));
            }

            childToParent[newResourceId] = entity.get('parent');

            // set children to empty array because these
            // are going to get added later on
            entity.set('children', []);
        };

        // add all entities with different resource ids
        var newEntity = null;
        var newEntities = [];

        for (var resourceId in data.hierarchy) {
            // create new entity
            var entity = new Observer(data.hierarchy[resourceId]);

            // find root of pasted hierarchy
            if (!entity.get('parent'))
                newEntity = entity;

            // change resource ids
            remapResourceIds(entity);

            // add it
            editor.call('entities:add', entity);
            newEntities.push(entity);
        }

        // reparent children correctly
        for (var i = 0; i < newEntities.length; i++) {
            var entity = newEntities[i];
            var parentEntity = editor.call('entities:get', entity.get('parent'));

            // sharejs
            editor.call('realtime:scene:op', {
                p: [ 'entities', entity.get('resource_id') ],
                oi: entity.json()
            });

            // this is necessary for the entity to be added to the tree view
            parentEntity.history.enabled = false;
            parentEntity.insert('children', entity.get('resource_id'));
            parentEntity.history.enabled = true;
        }

        // select pasted entity
        setTimeout(function() {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', [ newEntity ]);
            editor.once('selector:change', function() {
                editor.call('selector:history', true);
            });
        }, 0);

        // get final raw json for pasted entity
        var pastedData = newEntity.json();

        // add history
        editor.call('history:add', {
            name: 'paste entity ' + pastedData.resource_id,
            undo: function() {
                var entity = editor.call('entities:get', pastedData.resource_id);
                if (! entity)
                    return;

                removeEntity(entity);

                var selectorType = editor.call('selector:type');
                var selectorItems = editor.call('selector:items');
                if (selectorType === 'entity' && selectorItems.length) {
                    var items = [ ];
                    for(var i = 0; i < selectorItems.length; i++) {
                        var item = editor.call('entities:get', selectorItems[i]);
                        if (item)
                            items.push(item);
                    }

                    if (items.length) {
                        editor.call('selector:history', false);
                        editor.call('selector:set', selectorType, items);
                        editor.once('selector:change', function() {
                            editor.call('selector:history', true);
                        });
                    }
                }
            },
            redo: function() {
                var parentEntity = editor.call('entities:get', parent.get('resource_id'));
                if (! parentEntity)
                    return;

                var entity = new Observer(pastedData);
                childToParent[entity.get('resource_id')] = parentEntity.get('resource_id');
                addEntity(entity, parentEntity, true);
            }
        });
    });
});
