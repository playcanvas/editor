import type { EntityObserver } from '@playcanvas/editor-api';

editor.once('load', () => {
    const app = editor.call('viewport:app');

    // entities indexes for parenting
    const childIndex = { };
    const entitiesIndex = { };
    const unknowns = { };

    // queue for hierarchy resync
    let awaitingResyncHierarchy = false;

    const resyncHierarchy = function () {
        awaitingResyncHierarchy = false;

        if (!app) {
            return;
        } // webgl not available

        // sync hierarchy
        app.root.syncHierarchy();

        // render
        editor.call('viewport:render');
    };

    const createEntity = function (obj) {
        const entity = new pc.Entity();

        entitiesIndex[obj.get('resource_id')] = entity;

        entity.name = obj.get('name');
        entity.setGuid(obj.get('resource_id'));
        entity.setLocalPosition(obj.get('position.0'), obj.get('position.1'), obj.get('position.2'));
        entity.setLocalEulerAngles(obj.get('rotation.0'), obj.get('rotation.1'), obj.get('rotation.2'));
        entity.setLocalScale(obj.get('scale.0'), obj.get('scale.1'), obj.get('scale.2'));
        entity._enabled = obj.has('enabled') ? obj.get('enabled') : true;

        if (obj.has('labels')) {
            obj.get('labels').forEach((label) => {
                entity.addLabel(label);
            });
        }

        entity.template = obj.get('template');

        return entity;
    };

    const insertChild = function (parent, node, index) {
        // try to insert the node at the right index
        for (let i = 0, len = parent._children.length; i < len; i++) {
            const child = parent._children[i];
            if (child instanceof pc.Entity && childIndex[child.getGuid()]) {
                // if our index is less than this child's index
                // then put the item here
                if (index < childIndex[child.getGuid()].index) {
                    parent.insertChild(node, i);
                    return;
                }
            }
        }

        // the node can be safely added to the end of the child list
        parent.addChild(node);
    };

    const processEntity = function (obj: EntityObserver) {
        if (!app) {
            return null;
        } // webgl not available

        // create entity
        const entity = obj.entity = createEntity(obj);

        const children = obj.get('children');
        for (let i = 0; i < children.length; i++) {
            childIndex[children[i]] = {
                index: i,
                parent: entity
            };

            if (entitiesIndex[children[i]]) {
                insertChild(entity, entitiesIndex[children[i]], i);
            }
        }

        // parenting
        if (!obj.get('parent')) {
            // root
            app.root.addChild(entity);
        } else {
            // child
            const details = childIndex[obj.get('resource_id')];
            if (details && details.parent) {
                insertChild(details.parent, entity, details.index);
            }
        }

        return entity;
    };

    const processEntityComponents = function (entity, obj: EntityObserver) {

        if (!entity) {
            return;
        }

        // add components
        const components = obj.json().components;
        for (const key in components) {
            if (app.systems[key]) {
                if (key === 'script') {
                    continue;
                }

                // override particlesystem
                if (key === 'particlesystem') {
                    components[key].enabled = false;
                    components[key].autoPlay = true;
                } else if (key === 'animation') {
                    components[key].enabled = false;
                }

                app.systems[key].addComponent(entity, components[key]);
            } else if (!unknowns[key]) {
                unknowns[key] = true;
                console.log(`unknown component "${key}", in entity ${obj.get('resource_id')}`);
            }
        }

        // queue resync hierarchy
        // done on timeout to allow bulk entity creation
        // without rerender and sync after each entity
        if (!awaitingResyncHierarchy) {
            awaitingResyncHierarchy = true;
            setTimeout(resyncHierarchy, 0);
        }

        editor.emit('entities:add:entity', obj);
    };

    // Pending entities awaiting component creation
    // This batching ensures all entities are created before components are added,
    // allowing GUID references (like rootBone) to resolve correctly
    const pendingEntities: { entity: pc.Entity; observer: EntityObserver }[] = [];
    let awaitingComponentCreation = false;

    const processPendingComponents = function () {
        awaitingComponentCreation = false;

        // Process all pending entities - add components now that all entities exist
        for (const { entity, observer } of pendingEntities) {
            processEntityComponents(entity, observer);
        }
        pendingEntities.length = 0;
    };

    const createEntities = function () {
        // new entity created
        editor.on('entities:add', (entityObserver: EntityObserver) => {
            const entity = processEntity(entityObserver);

            // Queue entity for component creation
            pendingEntities.push({ entity, observer: entityObserver });

            // Defer component creation to allow batch entity creation
            // This ensures all entities exist before components are added,
            // which allows GUID references (e.g., rootBone) to resolve correctly
            if (!awaitingComponentCreation) {
                awaitingComponentCreation = true;
                setTimeout(processPendingComponents, 0);
            }
        });

        // clear entitiesIndex and childIndex
        editor.on('entities:remove', (obj) => {
            delete entitiesIndex[obj.get('resource_id')];
            const children = obj.get('children');
            for (let i = 0; i < children.length; i++) {
                delete childIndex[children[i]];
            }
        });

        const entities = editor.call('entities:list');

        // create entities and link up their hierarchies
        const createdEntities = entities.map(processEntity);

        // create components for entities afterwords, this allows them to reference other entities
        entities.forEach((entity, index) => {
            processEntityComponents(createdEntities[index], entity);
        });

        // give components that need it a chance to process entity references now
        // that the scene graph has loaded
        editor.call('viewport:resolveEntityReferences');
    };

    // handle synchronization - all assets must be loaded
    // before creating entities in the engine
    let assetsLoaded = false;
    let entitiesLoaded = false;

    editor.once('assets:load', () => {
        assetsLoaded = true;
        // if entities already loaded then create them
        if (entitiesLoaded) {
            createEntities();
        }
    });

    editor.once('entities:load', () => {
        entitiesLoaded = true;
        // if assets already loaded then create entities
        if (assetsLoaded) {
            createEntities();
        }
    });
});
