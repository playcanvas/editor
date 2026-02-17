import type { Observer } from '@playcanvas/observer';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    } // webgl not available

    // entities awaiting parent
    const awaitingParent = { };

    // queue for hierarchy resync
    let awaitingResyncHierarchy = false;

    const resyncHierarchy = function () {
        awaitingResyncHierarchy = false;

        // sync hierarchy
        app.root.syncHierarchy();
    };

    const createEntity = function (obj: Observer) {
        const entity = new pc.Entity(obj.get('name'));

        entity.setGuid(obj.get('resource_id'));
        entity.setLocalPosition(obj.get('position.0'), obj.get('position.1'), obj.get('position.2'));
        entity.setLocalEulerAngles(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2'));
        entity.setLocalScale(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2'));
        entity._enabled = obj.has('enabled') ? obj.get('enabled') : true;

        if (obj.has('labels')) {
            obj.get('labels').forEach((label: string) => {
                entity.addLabel(label);
            });
        }

        if (obj.has('tags')) {
            obj.get('tags').forEach((tag: string) => {
                entity.tags.add(tag);
            });
        }

        entity.template = obj.get('template');

        return entity;
    };

    const createEntityHierarchy = function (obj: Observer) {
        // create entity
        const entity = createEntity(obj);

        // parenting
        if (!obj.get('parent')) {
            // root
            app.root.addChild(entity);

        } else {
            // get parent
            let parent = editor.call('entities:get', obj.get('parent'));
            if (parent) {
                parent = app.root.findByGuid(parent.get('resource_id'));
            }

            if (!parent) {
                // if parent not available, then await
                if (!awaitingParent[obj.get('parent')]) {
                    awaitingParent[obj.get('parent')] = [];
                }

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
            for (let i = 0; i < awaitingParent[obj.get('resource_id')].length; i++) {
                const awaiting = awaitingParent[obj.get('resource_id')][i];
                entity.addChild(app.root.findByGuid(awaiting.get('resource_id')));
            }

            // delete awaiting queue
            delete awaitingParent[obj.get('resource_id')];
        }

        return entity;
    };

    const addEntityComponents = function (entity: pc.Entity, obj: Observer) {
        // add components
        const components = obj.json().components;
        for (const key in components) {
            app.systems[key].addComponent(entity, components[key]);
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without sync after each entity
        if (!awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }
    };

    // Pending entities awaiting component creation
    // This batching ensures all entities are created before components are added,
    // allowing GUID references (like rootBone) to resolve correctly
    const pendingEntities = [];
    let awaitingComponentCreation = false;

    const processPendingComponents = function () {
        awaitingComponentCreation = false;

        // Process all pending entities - add components now that all entities exist
        for (let i = 0; i < pendingEntities.length; i++) {
            const pending = pendingEntities[i];
            addEntityComponents(pending.entity, pending.obj);
        }
        pendingEntities.length = 0;
    };

    editor.on('entities:add', (obj: Observer) => {
        const sceneLoading = editor.call('isLoadingScene');
        if (!app.root.findByGuid(obj.get('resource_id')) && !sceneLoading) {
            // create entity if it does not exist and all initial entities have loaded
            const entity = createEntityHierarchy(obj);

            // Queue entity for component creation
            pendingEntities.push({ entity: entity, obj: obj });

            // Defer component creation to allow batch entity creation
            // This ensures all entities exist before components are added,
            // which allows GUID references (e.g., rootBone) to resolve correctly
            if (!awaitingComponentCreation) {
                awaitingComponentCreation = true;
                setTimeout(processPendingComponents, 0);
            }
        }

        const resetPhysics = function (entity: pc.Entity) {
            const pos = obj.get('position');
            const rot = obj.get('rotation');
            const scale = obj.get('scale');

            // if the entity has an element component
            // then only set z and let the rest be handled
            // by the element component (unless autoWidth or autoHeight is true in which case we need to be able to modify position)
            if (!entity.element || entity.element.autoWidth || entity.element.autoHeight) {
                entity.setLocalPosition(pos[0], pos[1], pos[2]);
            } else {
                const localPos = entity.getLocalPosition();
                entity.setLocalPosition(localPos.x, localPos.y, pos[2]);
            }

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

        // subscribe to changes
        obj.on('*:set', (path: string, value: unknown) => {
            const entity = app.root.findByGuid(obj.get('resource_id'));
            if (!entity) {
                return;
            }

            if (path === 'name') {
                entity.name = obj.get('name');

            } else if (path.startsWith('position')) {
                resetPhysics(entity);

            } else if (path.startsWith('rotation')) {
                resetPhysics(entity);

            } else if (path.startsWith('scale')) {
                resetPhysics(entity);

            } else if (path.startsWith('enabled')) {
                entity.enabled = obj.get('enabled');

            } else if (path.startsWith('parent')) {
                const parent = editor.call('entities:get', obj.get('parent'));
                if (parent && parent.entity && entity.parent !== parent.entity) {
                    entity.reparent(parent.entity);
                }
            } else if (path === 'components.model.type' && value === 'asset') {
                // WORKAROUND
                // entity deletes asset when switching to primitive, restore it
                // do this in a timeout to allow the model type to change first
                setTimeout(() => {
                    const assetId = obj.get('components.model.asset');
                    if (assetId) {
                        entity.model.asset = assetId;
                    }
                });
            } else if (path === 'components.element.type') {
                // Changing an element's 'type' fundamentally changes the way it renderers and uses its configuration.
                // In order to make sure all textures and other resources are cleared, we'll remove the component
                // and add it again. Note that, since all properties were already saved at the 'scene' level,
                // the new component will retain all user data.
                entity.removeComponent('element');
                entity.addComponent('element', obj.get('components.element'));
            }
        });

        obj.on('tags:insert', (value: string) => {
            const entity = app.root.findByGuid(obj.get('resource_id'));
            if (entity) {
                entity.tags.add(value);
            }
        });

        obj.on('tags:remove', (value: string) => {
            const entity = app.root.findByGuid(obj.get('resource_id'));
            if (entity) {
                entity.tags.remove(value);
            }
        });

        const reparent = function (child: Observer, index: number) {
            let childEntity = editor.call('entities:get', child);
            if (!childEntity) {
                return;
            }

            childEntity = app.root.findByGuid(childEntity.get('resource_id'));
            const parentEntity = app.root.findByGuid(obj.get('resource_id'));

            if (childEntity && parentEntity) {
                if (childEntity.parent) {
                    childEntity.parent.removeChild(childEntity);
                }

                // skip any graph nodes
                if (index > 0) {
                    let i, len;
                    const children = parentEntity.children;
                    for (i = 0, len = children.length; i < len && index > 0; i++) {
                        if (children[i] instanceof pc.Entity) {
                            index--;
                        }
                    }

                    index = i;
                }

                // re-insert
                parentEntity.insertChild(childEntity, index);
            }
        };

        obj.on('children:insert', reparent);
        obj.on('children:move', reparent);
    });

    editor.on('entities:remove', (obj: Observer) => {
        const entity = app.root.findByGuid(obj.get('resource_id'));
        if (entity) {
            entity.destroy();
            editor.call('viewport:render');
        }
    });
});
