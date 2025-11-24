import { Entity } from '../entity';
import { globals as api } from '../globals';

/**
 * Creates new entity and adds it to the hierarchy
 *
 * @param data - Optional initial data for the entity
 * @param options.index - The child index that this entity will have under its parent.
 * @param options.history - Whether to record a history action. Defaults to true.
 * @param options.select - Whether to select new Entity. Defaults to false.
 * @returns The new entity
 */
function createEntity(data: any, options: { index?: number, history?: boolean, select?: boolean } = {}): Entity {
    data = data || {};

    if (options.history === undefined) {
        options.history = true;
    }

    if (!data.parent) {
        data.parent = api.entities.root ? api.entities.root.get('resource_id') : null;
    }

    if (data.parent instanceof Entity) {
        data.parent = data.parent.get('resource_id');
    }


    if (data.parent && !api.entities.get(data.parent)) {
        console.error(`Cannot create entity because parent ${data.parent} was not found`);
        return null;
    }

    let entity = new Entity(data);

    api.entities.add(entity);

    // sharedb
    if (api.realtime && api.realtime.scenes.current) {
        api.realtime.scenes.current.addEntity(entity);
    }

    const parent = api.entities.get(data.parent);
    if (parent) {
        if (options.index === undefined) {
            parent.addChild(entity);
        } else {
            parent.insertChild(entity, options.index);
        }
    }

    // use same resource id in redo's
    data.resource_id = entity.get('resource_id');

    // add children
    if (data.children) {
        data.children.forEach((childData: { parent: Entity; resource_id: any; }) => {
            childData.parent = entity;
            const child = createEntity(childData, {
                history: false,
                select: false
            });

            // use same resource_id in subsequent redo's
            childData.resource_id = child.get('resource_id');
        });
    }

    if (data.onCreate) {
        data.onCreate(entity);
    }

    let prevSelection: any[];

    // remember previous selection
    if (options.history && api.history) {
        if (options.select && api.selection) {
            prevSelection = api.selection.items;
        }
    }

    // select new entity
    if (options.select && api.selection) {
        api.selection.set([entity], {
            history: false
        });
    }

    if (options.history && api.history) {
        api.history.add({
            name: `new entity ${entity.get('resource_id')}`,
            combine: false,
            // undo new entity
            undo: () => {
                entity = entity.latest();
                if (!entity) return;

                api.entities.delete([entity], {
                    history: false
                });

                if (prevSelection) {
                    api.selection.set(prevSelection, {
                        history: false
                    });
                }
            },
            // redo new entity
            redo: () => {
                entity = createEntity(data, {
                    history: false,
                    select: options.select
                });
            }
        });
    }

    return entity;
}

export { createEntity };
