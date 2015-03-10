app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');

    var initialEntitiesLoaded = false;

    // entities awaiting parent
    var awaitingParent = { };

    // queue for hierarchy resync
    var awaitingResyncHierarchy = false;

    var resyncHierarchy = function() {
        awaitingResyncHierarchy = false;

        // sync hierarchy
        framework.root.syncHierarchy();
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
        var entity = createEntity(obj);

        // add components
        var components = obj.json().components;
        for(var key in components)
            framework.systems[key].addComponent(entity, components[key]);

        // parenting
        if (! obj.get('parent')) {
            // root
            framework.root.addChild(entity);

        } else {
            // get parent
            var parent = app.call('entities:get', obj.get('parent'));
            if (parent) {
                parent = framework.root.findByGuid(parent.get('resource_id'));
            }

            if (! parent) {
                // if parent not available, then await
                if (! awaitingParent[obj.get('parent')])
                    awaitingParent[obj.get('parent')] = [ ];

                // add to awaiting children
                awaitingParent[obj.get('parent')].push(obj);
            } else {
                // if parent available, addChild
                parent.addChild(entity);
            }
        }

        // check if there are awaiting children
        if (awaitingParent[obj.get('resource_id')]) {
            // add all awaiting children
            for(var i = 0; i < awaitingParent[obj.get('resource_id')].length; i++) {
                var awaiting = awaitingParent[obj.get('resource_id')][i];
                entity.addChild(framework.root.getByGuid(awaiting.get('resource_id')));
            }

            // delete awaiting queue
            delete awaitingParent[obj.get('resource_id')];
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without sync after each entity
        if (! awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }

        return entity;
    };

    app.on('entities:add', function (obj) {
        if (! framework.root.findByGuid(obj.get('resource_id')) && initialEntitiesLoaded) {
            // create entity if it does not exist and all initial entities have loaded
            processEntity(obj);
        }

        // subscribe to changes
        obj.on('*:set', function(path, value) {
            var entity = framework.root.findByGuid(obj.get('resource_id'));
            if (! entity)
                return;

            if (path === 'name') {
                entity.setName(obj.get('name'));

            } else if (path.indexOf('position') === 0) {
                entity.setLocalPosition(new pc.Vec3(obj.get('position.0'), obj.get('position.1'), obj.get('position.2')));
                updatePhysics(entity);

            } else if (path.indexOf('rotation') === 0) {
                entity.setLocalEulerAngles(new pc.Vec3(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2')));
                updatePhysics(entity);

            } else if (path.indexOf('scale') === 0) {
                entity.setLocalScale(new pc.Vec3(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2')));
                updatePhysics(entity);

            } else if (path.indexOf('enabled') === 0) {
                entity.enabled = obj.get('enabled');

            } else if (path.indexOf('parent') === 0) {
                var parent = app.call('entities:get', obj.get('parent'));
                if (parent && parent.entity)
                    entity.reparent(parent.entity);
            }
        });

        var updatePhysics = function (entity) {
            if (entity.enabled) {
                if (entity.rigidbody && entity.rigidbody.enabled) {
                    entity.rigidbody.syncEntityToBody();

                    // Reset velocities
                    entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
                    entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
                }

                if (entity.collision && entity.collision.enabled) {
                    framework.systems.collision.onTransformChanged(entity.collision, entity.getPosition(), entity.getRotation(), entity.getLocalScale());
                }
            }
        };

        var reparent = function (child, index) {
            var childEntity = app.call('entities:get', child);
            if (!childEntity)
                return;

            childEntity = framework.root.findByGuid(childEntity.get('resource_id'));
            var parentEntity = framework.root.findByGuid(obj.get('resource_id'));

            if (childEntity && parentEntity) {
                childEntity.reparent(parentEntity, index);
            }
        };

        obj.on('children:insert', reparent);
        obj.on('children:move', reparent);
    });

    app.on('entities:remove', function (obj) {
        var entity = framework.root.findByGuid(obj.get('resource_id'));
        if (entity) {
            entity.destroy();
        }

    });

    app.on('entities:load', function () {
        initialEntitiesLoaded = true;
    });
});
