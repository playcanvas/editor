editor.once('load', function() {
    'use strict'

    var framework = editor.call('3d:framework');


    // entities awaiting parent
    var awaitingParent = { };


    // queue for hierarchy resync
    var awaitingResyncHierarchy = false;

    var resyncHierarchy = function() {
        awaitingResyncHierarchy = false;

        // sync hierarchy
        framework.context.root.syncHierarchy();

        // render
        editor.call('3d:render');
    };

    var loadEntity = function (data) {
        var entity = new pc.Entity();

        var p = data.position;
        var r = data.rotation;
        var s = data.scale;

        entity.setName(data.name);
        entity.setGuid(data.resource_id);
        entity.setLocalPosition(p[0], p[1], p[2]);
        entity.setLocalEulerAngles(r[0], r[1], r[2]);
        entity.setLocalScale(s[0], s[1], s[2]);
        entity._enabled = data.enabled !== undefined ? data.enabled : true;
        entity._enabledInHierarchy = entity._enabled;

        if (data.labels) {
            data.labels.forEach(function (label) {
                entity.addLabel(label);
            });
        }

        entity.template = data.template;

        return entity;
    };


    // new entity created
    editor.on('entities:add', function (data) {
        // create entity
        var entity = data.entity = loadEntity(data);

        // add components
        var components = data.json().components;
        for(var key in components)
            framework.context.systems[key].addComponent(entity, components[key]);

        // parenting
        if (! data.parent) {
            // root
            framework.context.root.addChild(entity);

        } else {
            // get parent
            var parent = editor.call('entities:get', data.parent);

            if (! parent || ! parent.entity) {
                // if parent not available, then await
                if (! awaitingParent[data.parent])
                    awaitingParent[data.parent] = [ ];

                // add to awaiting children
                awaitingParent[data.parent].push(data);
            } else {
                // if parent available, addChild
                parent.entity.addChild(entity);
            }
        }

        // check if there are awaiting children
        if (awaitingParent[data.resource_id]) {
            // add all awaiting children
            for(var i = 0; i < awaitingParent[data.resource_id].length; i++)
                entity.addChild(awaitingParent[data.resource_id][i].entity);

            // delete awaiting queue
            delete awaitingParent[data.resource_id];
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without rerender and sync after each entity
        if (! awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }
    });
});
