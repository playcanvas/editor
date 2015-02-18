editor.once('load', function() {
    'use strict';

    var framework = editor.call('viewport:framework');

    // entities awaiting parent
    var awaitingParent = { };

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

        entity.setName(obj.get('name'));
        entity.setGuid(obj.get('resource_id'));
        entity.setLocalPosition(obj.get('position.0'), obj.get('position.1'), obj.get('position.2'));
        entity.setLocalEulerAngles(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2'));
        entity.setLocalScale(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2'));
        entity._enabled = obj.has('enabled') ? obj.get('enabled') : true;
        entity._enabledInHierarchy = entity._enabled;

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
        for(var key in components)
            framework.context.systems[key].addComponent(entity, components[key]);

        // parenting
        if (! obj.get('parent')) {
            // root
            framework.context.root.addChild(entity);

        } else {
            // get parent
            var parent = editor.call('entities:get', obj.get('parent'));

            if (! parent || ! parent.entity) {
                // if parent not available, then await
                if (! awaitingParent[obj.get('parent')])
                    awaitingParent[obj.get('parent')] = [ ];

                // add to awaiting children
                awaitingParent[obj.get('parent')].push(obj);
            } else {
                // if parent available, addChild
                parent.entity.addChild(entity);
            }
        }

        // check if there are awaiting children
        if (awaitingParent[obj.get('resource_id')]) {
            // add all awaiting children
            for(var i = 0; i < awaitingParent[obj.get('resource_id')].length; i++)
                entity.addChild(awaitingParent[obj.get('resource_id')][i].entity);

            // delete awaiting queue
            delete awaitingParent[obj.get('resource_id')];
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without rerender and sync after each entity
        if (! awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }
    };

    var createEntities = function() {
        // new entity created
        editor.on('entities:add', function (obj) {
            processEntity(obj);
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
        if (entitiesLoaded) {
            createEntities();
        }
    });

    editor.once('entities:load', function() {
        entitiesLoaded = true;
        // if assets already loaded then create entities
        if (assetsLoaded) {
            createEntities();
        }
    });
});
