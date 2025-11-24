import { Events, ObserverList } from '@playcanvas/observer';

import { copyEntities } from './entities/copy';
import { createEntity } from './entities/create';
import { deleteEntities } from './entities/delete';
import { duplicateEntities } from './entities/duplicate';
import { pasteEntities } from './entities/paste';
import { updateReferences } from './entities/references';
import { reparentEntities } from './entities/reparent';
import { addScript, removeScript } from './entities/scripts';
import { wait } from './entities/wait';
import { Entity } from './entity';
import { globals as api } from './globals';

/**
 * Data to create a new Entity
 */
export type CreateEntityArguments = {
    /**
     * The entity name
     */
    name: string;

    /**
     * Component data. See {@link Entity} for details on component data.
     */
    components: object;

    /**
     * The parent Entity or its resource_id. If undefined then the root Entity will be used as the parent.
     */
    parent: Entity | string;

    /**
     * Data for child entities.
     */
    children: CreateEntityArguments[];

    /**
     * Tags for the Entity.
     */
    tags: string[];

    /**
     * Whether the Entity should be enabled.
     */
    enabled: boolean;

    /**
     * The resource_id of the Entity. Leave undefined to generate a new one.
     */
    resource_id?: string;

    /**
     * The position of the Entity in local space.
     */
    position: number[];

    /**
     * The rotation of the Entity in local space (euler angles in degrees).
     */
    rotation: number[];

    /**
     * The scale of the Entity in local space.
     */
    scale: number[];
};

/**
 * Data to reparent an entity under a new parent
 */
export type ReparentArguments = {
    /**
     * The entity to reparent
     */
    entity: Entity;

    /**
     * The new parent for the entity
     */
    parent: Entity;

    /**
     * The child index of the entity under the new parent
     */
    index: number;
};

/**
 * The entities editor API
 */
class Entities extends Events {
    private _root: Entity;

    private _entities: ObserverList;

    /**
     * Creates new API instance
     *
     * @category Internal
     */
    constructor() {
        super();

        this._root = null;

        this._entities = new ObserverList({
            index: 'resource_id'
        });
    }

    /**
     * Gets entity by resource id
     *
     * @param id - The entity's resource id
     * @returns The entity
     * @example
     * ```javascript
     * const entity = editor.entities.get(resourceId);
     * ```
     */
    get(id: string): Entity | null {
        const e = this._entities.get(id);
        return e ? e.apiEntity : null;
    }

    /**
     * Returns array of all entities
     *
     * @returns The entities
     * @example
     * ```javascript
     * const entities = editor.entities.list();
     * console.log(entities.length);
     * ```
     */
    list() {
        return this._entities.array().map((e: { apiEntity: any; }) => e.apiEntity);
    }

    /**
     * Adds entity to list
     *
     * @category Internal
     * @param entity - The entity
     */
    add(entity: Entity) {
        const id = entity.get('resource_id');

        if (this.get(id)) {
            console.error(`Cannot add duplicate Entity ${id}`);
            return;
        }

        this._entities.add(entity.observer);
        if (!entity.get('parent')) {
            if (this._root) {
                console.error(`More than one root entities in Scene. Current root is Entity "${this._root.get('name')}" [${this._root.get('resource_id')}] but Entity "${entity.get('name')}" [${id}] also has a null parent`);
            } else {
                this._root = entity;
            }
        }

        entity._initializeHistory();

        this.emit('add', entity, this._root === entity);
    }

    /**
     * Called when an entity is added from the server
     *
     * @category Internal
     * @param entityData - The entity data
     */
    serverAdd(entityData: { parent: Entity, children: Entity[] }) {
        const entity = new Entity(entityData as object);
        entity.set('parent', entityData.parent);
        entity.set('children', entityData.children);
        this.add(entity);
    }

    /**
     * Removes entity from the list
     *
     * @category Internal
     * @param entity - The entity
     * @param entityReferences - A map of entity references to nullify
     * when this entity is removed
     */
    remove(entity: Entity, entityReferences: object = null) {
        if (entityReferences) {
            updateReferences(entityReferences, entity.get('resource_id'), null);
        }

        // remove children first
        entity.children.forEach((child: Entity) => {
            this.remove(child, entityReferences);
        });

        // remove from selection
        if (api.selection && api.selection.has(entity)) {
            api.selection.remove(entity, {
                history: false
            });
        }

        // remove from parent
        if (entity.parent) {
            entity.parent.removeChild(entity);
        }

        // remove from observer list
        try {
            this._entities.remove(entity.observer);
            entity.observer.destroy();
        } catch (err) {
            console.error(err);
        }

        // reset root
        if (this._root === entity) {
            this._root = null;
        }

        // sharedb
        if (api.realtime && api.realtime.scenes.current) {
            api.realtime.scenes.current.removeEntity(entity);
        }

        this.emit('remove', entity);
    }

    /**
     * Called when an entity is removed from the server
     *
     * @category Internal
     * @param entity - The entity
     */
    serverRemove(entity: Entity) {
        if (api.selection && api.selection.has(entity)) {
            api.selection.remove(entity, {
                history: false
            });
        }

        this._entities.remove(entity.observer);
        entity.observer.destroy();

        if (this._root === entity) {
            this._root = null;
        }

        this.emit('remove', entity);
    }

    /**
     * Removes all entities from the list
     *
     * @category Internal
     */
    clear() {
        this._root = null;
        const entities = this.list();
        this._entities.clear();

        if (api.selection) {
            if (api.selection.items[0] instanceof Entity)  {
                const history = api.selection.history.enabled;
                api.selection.history.enabled = false;
                api.selection.clear();
                api.selection.history.enabled = history;
            }
        }

        entities.forEach((entity: any) => {
            entity.observer.destroy();
            this.emit('remove', entity);
        });

        this.emit('clear');
    }

    /**
     * Creates new entity and adds it to the hierarchy
     *
     * @param data - Initial data for the entity
     * @param options.index - The child index that this entity will have under its parent.
     * @param options.history - Whether to record a history action. Defaults to true.
     * @param options.select - Whether to select new Entity. Defaults to false.
     * @returns The new entity
     *
     * @example
     * ```javascript
     * const root = editor.entities.create({
     *     name: 'parent',
     * });
     *
     * const child = editor.entities.create({
     *     name: 'child',
     *     parent: root,
     * });
     *```
     */
    create(data: CreateEntityArguments = null, options: { index?: number, history?: boolean, select?: boolean } = {}) {
        return createEntity(data, options);
    }

    /**
     * Delete specified entities
     *
     * @param entities - The entities
     * @param options.history - Whether to record a history action. Defaults to true.
     *
     * @example
     * ```javascript
     * await editor.entities.delete([entity1, entity2]);
     * ```
     */
    async delete(entities: Entity[] | Entity, options: { history?: boolean } = {}) {
        await deleteEntities(entities, options);
    }

    /**
     * Reparents entities under new parent.
     *
     * @param data - The reparenting data
     * @param options.preserveTransform - Whether to preserve the transform of the entities. Defaults to false.
     * @param options.history - Whether to record history. Defaults to true
     * @example
     * ```javascript
     * const child = editor.entities.create();
     * const parent = editor.entities.create();
     * editor.entities.reparent([{
     *     entity: child,
     *     parent: parent
     * }])
     * ```
     */
    reparent(data: ReparentArguments[], options: { preserveTransform?: boolean, history?: boolean } = {}) {
        reparentEntities(data, options);
    }

    /**
     * Duplicates the specified entities under the same parent
     *
     * @param entities - The entities
     * @param options.history - Whether to record a history action. Defaults to true.
     * @param options.select - Whether to select the new entities. Defaults to false.
     * @param options.rename - Whether to rename the duplicated entities. Defaults to false.
     * @returns The duplicated entities
     * @example
     * const duplicated = await editor.entities.duplicate(entities);
     */
    async duplicate(entities: Entity[], options: { history?: boolean, select?: boolean, rename?: boolean } = {}) {
        const result = await duplicateEntities(entities, options);
        return result;

    }

    /**
     * Copy specified entities to localStorage clipboard. Can be used
     * to paste these entities later on.
     *
     * @param entities - The entities
     */
    copyToClipboard(entities: Entity[]) {
        copyEntities(entities);
    }

    /**
     * Paste entities copied into clipboard
     * under the specified parent.
     *
     * @param parent - The parent
     * @param options.history - Whether to record a history action. Defaults to true.
     * @returns The new entities
     */
    pasteFromClipboard(parent: Entity, options: { history?: boolean } = {}) {
        return pasteEntities(parent, options);
    }

    /**
     * Waits for specified entity ids to be added to the scene.
     * Once they are the callback is called with the entities as its argument.
     *
     * @param entityIds - The ids of the entities to wait for
     * @param timeoutMs - Number of ms to wait before stopping to wait
     * @param callback - The callback to call when all entities have been added.
     * The signature is (Entity[]) => void.
     * @returns Returns a cancel function which can be called to cancel calling the
     * callback when the entities are added.
     */
    waitToExist(entityIds: string[], timeoutMs: number, callback: (entities: Entity[]) => void) {
        return wait(entityIds, timeoutMs, callback);
    }

    /**
     * Like {@link Entity.addScript} but works on multiple entities using
     * a single history action.
     *
     * @param entities - The entities.
     * @param scriptName - The name of the script.
     * @param options.attributes - The values of attributes. Each key is the name
     * of the attributes and each value is the value for that attribute. Leave undefined to
     * let the Editor set default values depending on the attribute types.
     * @param options.history - Whether to add a history action. Defaults to true.
     * @param options.index - The desired index in the entity's scripts order to add this script.
     * @returns A promise
     */
    addScript(entities: Entity[], scriptName: string, options: { attributes?: object, history?: boolean, index?: number } = {}) {
        return addScript(entities, scriptName, options);
    }

    /**
     * Like {@link Entity.removeScript} but works on multiple entities using
     * a single history action.
     *
     * @param entities - The entities.
     * @param scriptName - The name of the script.
     * @param options.history - Whether to record a history action. Defaults to true.
     */
    removeScript(entities: Entity[], scriptName: string, options: { history?: boolean } = {}) {
        removeScript(entities, scriptName, options);
    }

    get raw() {
        return this._entities;
    }

    /**
     * Gets the root Entity
     */
    get root() {
        return this._root;
    }
}

export { Entities };
