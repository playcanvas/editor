editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');

    // entities indexes for parenting
    var childIndex = { };
    var entitiesIndex = { };
    var unknowns = { };

    // queue for hierarchy resync
    var awaitingResyncHierarchy = false;

    var resyncHierarchy = function() {
        awaitingResyncHierarchy = false;

        // sync hierarchy
        framework.context.root.syncHierarchy();

        // render
        editor.call('viewport:render');
    };

    var createEntity = function (obj) {
        var entity = new pc.Entity();

        entitiesIndex[obj.get('resource_id')] = entity;

        entity.setName(obj.get('name'));
        entity.setGuid(obj.get('resource_id'));
        entity.setLocalPosition(obj.get('position.0'), obj.get('position.1'), obj.get('position.2'));
        entity.setLocalEulerAngles(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2'));
        entity.setLocalScale(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2'));
        entity._enabled = obj.has('enabled') ? obj.get('enabled') : true;

        if (obj.has('labels')) {
            obj.get('labels').forEach(function (label) {
                entity.addLabel(label);
            });
        }

        entity.template = obj.get('template');

        return entity;
    };

    var processEntity = function (obj) {
        // create entity
        var entity = obj.entity = createEntity(obj);

        // add components
        var components = obj.json().components;
        for(var key in components) {
            if (framework.context.systems[key]) {
                if (key === 'script')
                    continue;

                framework.context.systems[key].addComponent(entity, components[key]);
            } else if (! unknowns[key]) {
                unknowns[key] = true;
                console.log('unknown component "' + key + '", in entity ' + obj.get('resource_id'));
            }
        }

        var children = obj.get('children');
        for(var i = 0; i < children.length; i++) {
            childIndex[children[i]] = entity;

            if (entitiesIndex[children[i]])
                entity.addChild(entitiesIndex[children[i]]);
        }

        // parenting
        if (! obj.get('parent')) {
            // root
            framework.context.root.addChild(entity);
        } else {
            // child
            var parent = childIndex[obj.get('resource_id')];
            if (parent)
                parent.addChild(entity);
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without rerender and sync after each entity
        if (! awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }

        editor.emit('entities:add:entity', obj);
    };

    var createEntities = function() {
        // new entity created
        editor.on('entities:add', function (obj) {
            processEntity(obj);
        });

        // clear entitiesIndex and childIndex
        editor.on('entities:remove', function (obj) {
            delete entitiesIndex[obj.get('resource_id')];
            var children = obj.get('children');
            for(var i = 0; i < children.length; i++) {
                delete childIndex[children[i]];
            }
        });

        var entities = editor.call('entities:list');
        entities.forEach(processEntity);
    };

    // handle synchronization - all assets must be loaded
    // before creating entities in the engine
    var assetsLoaded = false;
    var entitiesLoaded = false;

    editor.once('assets:load', function () {
        assetsLoaded = true;
        // if entities already loaded then create them
        if (entitiesLoaded)
            createEntities();
    });

    editor.once('entities:load', function() {
        entitiesLoaded = true;
        // if assets already loaded then create entities
        if (assetsLoaded)
            createEntities();
    });
});
