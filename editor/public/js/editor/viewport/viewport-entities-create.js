(function () {

var createEntities = function () {
    'use strict'

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

        var p = obj.position;
        var r = obj.rotation;
        var s = obj.scale;

        entity.setName(obj.name);
        entity.setGuid(obj.resource_id);
        entity.setLocalPosition(p[0], p[1], p[2]);
        entity.setLocalEulerAngles(r[0], r[1], r[2]);
        entity.setLocalScale(s[0], s[1], s[2]);
        entity._enabled = obj.enabled !== undefined ? obj.enabled : true;
        entity._enabledInHierarchy = entity._enabled;

        if (obj.labels) {
            obj.labels.forEach(function (label) {
                entity.addLabel(label);
            });
        }

        entity.template = obj.template;

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
        if (! obj.parent) {
            // root
            framework.context.root.addChild(entity);

        } else {
            // get parent
            var parent = editor.call('entities:get', obj.parent);

            if (! parent || ! parent.entity) {
                // if parent not available, then await
                if (! awaitingParent[obj.parent])
                    awaitingParent[obj.parent] = [ ];

                // add to awaiting children
                awaitingParent[obj.parent].push(obj);
            } else {
                // if parent available, addChild
                parent.entity.addChild(entity);
            }
        }

        // check if there are awaiting children
        if (awaitingParent[obj.resource_id]) {
            // add all awaiting children
            for(var i = 0; i < awaitingParent[obj.resource_id].length; i++)
                entity.addChild(awaitingParent[obj.resource_id][i].entity);

            // delete awaiting queue
            delete awaitingParent[obj.resource_id];
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without rerender and sync after each entity
        if (! awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }
    };

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

})();


