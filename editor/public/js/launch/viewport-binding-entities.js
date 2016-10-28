editor.once('load', function() {
    'use strict';

    var app = editor.call('viewport:app');

    var initialEntitiesLoaded = false;

    // entities awaiting parent
    var awaitingParent = { };

    // queue for hierarchy resync
    var awaitingResyncHierarchy = false;

    var resyncHierarchy = function() {
        awaitingResyncHierarchy = false;

        // sync hierarchy
        app.root.syncHierarchy();
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
            app.systems[key].addComponent(entity, components[key]);

        // parenting
        if (! obj.get('parent')) {
            // root
            app.root.addChild(entity);

        } else {
            // get parent
            var parent = editor.call('entities:get', obj.get('parent'));
            if (parent) {
                parent = app.root.findByGuid(parent.get('resource_id'));
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
                entity.addChild(app.root.getByGuid(awaiting.get('resource_id')));
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

    editor.on('entities:add', function (obj) {
        var sceneLoading = editor.call("isLoadingScene");
        if (! app.root.findByGuid(obj.get('resource_id')) && !sceneLoading) {
            // create entity if it does not exist and all initial entities have loaded
            processEntity(obj);
        }

        // subscribe to changes
        obj.on('*:set', function(path, value) {
            var entity = app.root.findByGuid(obj.get('resource_id'));
            if (! entity)
                return;

            if (path === 'name') {
                entity.setName(obj.get('name'));

            } else if (path.startsWith('position')) {
                resetPhysics(entity);

            } else if (path.startsWith('rotation')) {
                resetPhysics(entity);

            } else if (path.startsWith('scale')) {
                resetPhysics(entity);

            } else if (path.startsWith('enabled')) {
                entity.enabled = obj.get('enabled');

            } else if (path.startsWith('parent')) {
                var parent = editor.call('entities:get', obj.get('parent'));
                if (parent && parent.entity)
                    entity.reparent(parent.entity);
            } else if (path === 'components.model.type' && value === 'asset') {
                // WORKAROUND
                // entity deletes asset when switching to primitive, restore it
                // do this in a timeout to allow the model type to change first
                setTimeout(function () {
                    var assetId = obj.get('components.model.asset');
                    if (assetId)
                        entity.model.asset = assetId;
                });
            }
        });

        var resetPhysics = function (entity) {
            var pos = obj.get('position');
            var rot = obj.get('rotation');
            var scale = obj.get('scale');

            entity.setLocalPosition(pos[0], pos[1], pos[2]);
            entity.setLocalEulerAngles(rot[0], rot[1], rot[2]);
            entity.setLocalScale(scale[0], scale[1], scale[2]);

            if (entity.enabled) {
                if (entity.rigidbody && entity.rigidbody.enabled) {
                    entity.rigidbody.syncEntityToBody();

                    // Reset velocities
                    entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
                    entity.rigidbody.angularVelocity = pc.Vec3.ZERO;
                }
            }
        };

        var reparent = function (child, index) {
            var childEntity = editor.call('entities:get', child);
            if (!childEntity)
                return;

            childEntity = app.root.findByGuid(childEntity.get('resource_id'));
            var parentEntity = app.root.findByGuid(obj.get('resource_id'));

            if (childEntity && parentEntity) {
                childEntity.reparent(parentEntity, index);
            }
        };

        obj.on('children:insert', reparent);
        obj.on('children:move', reparent);
    });

    editor.on('entities:remove', function (obj) {
        var entity = app.root.findByGuid(obj.get('resource_id'));
        if (entity) {
            entity.destroy();
            editor.call('viewport:render');
        }
    });

    editor.on('entities:load', function () {
        initialEntitiesLoaded = true;
    });
});
