import { Events, Observer, ObserverHistory } from '@playcanvas/observer';

import { globals as api } from './globals';
import { Guid } from './guid';

/**
 * Represents an observer for an entity, extending the base Observer.
 */
export type EntityObserver = Observer & {
    /**
     * The API entity associated with this observer.
     */
    apiEntity: Entity;

    /**
     * The history of changes made to the observer.
     */
    history: ObserverHistory;

    /**
     * A function that returns the latest observer.
     */
    latestFn: () => Observer;

    /**
     * The Engine entity associated with this observer.
     */
    entity: any;
};

/**
 * The Entity class represents an entity in the Editor.
 */
class Entity extends Events {
    private _observer: EntityObserver;

    private _history: ObserverHistory | {};


    /**
     * Creates new Entity
     *
     * @category Internal
     * @param data - Optional entity data
     */
    constructor(data: any = {}) {
        super();

        let name = data.name;
        if (name === undefined || typeof name !== 'string') {
            name = 'New Entity';
        }

        const observerData: {
            name: string;
            tags: string[];
            enabled: boolean;
            resource_id: string;
            parent: string | null;
            children: EntityObserver[];
            position: number[];
            rotation: number[];
            scale: number[];
            components: {};
            template_id?: number;
            template_ent_ids?: Record<string, string>;
        } = {
            name: name,
            tags: data.tags || [],
            enabled: data.enabled !== undefined ? !!data.enabled : true,
            resource_id: data.resource_id || Guid.create(),
            parent: typeof data.parent === 'string' ? data.parent : null,
            children: [] as EntityObserver[],
            position: data.position || [0, 0, 0],
            rotation: data.rotation || [0, 0, 0],
            scale: data.scale || [1, 1, 1],
            components: {}
        };

        if (data.template_id) {
            observerData.template_id = data.template_id;
        }
        if (data.template_ent_ids) {
            observerData.template_ent_ids = data.template_ent_ids;
        }

        this._observer = new Observer(observerData) as EntityObserver;

        this._observer.addEmitter(this);

        const id = this._observer.get('resource_id');

        this._observer.latestFn = () => {
            const latest = api.entities.get(id);
            return latest && latest._observer;
        };

        this._observer.apiEntity = this;

        if (data.components) {
            for (const component in data.components) {
                this.addComponent(component, data.components[component]);
            }
        }

        this._history = {};
    }

    _initializeHistory() {
        if (this._observer.history) return;

        this._history = new ObserverHistory({
            item: this._observer,
            prefix: `entity.${this.get('resource_id')}.`,
            history: api.history
        });
        this._observer.history = this._history as ObserverHistory;
    }

    /**
     * Checks if path exists. See {@link Entity} for a list of properties.
     *
     * @param path - The path
     * @returns True if path exists
     * @example
     * ```javascript
     * console.log(entity.has('components.model'));
     * ```
     */
    has(path: string) {
        return this._observer.has(path);
    }

    /**
     * Gets value at path. See {@link Entity} for a list of properties.
     *
     * @param path - The path
     * @returns The value
     * @example
     * ```javascript
     * console.log(entity.get('position'));
     * ```
     */
    get(path: string) {
        return this._observer.get(path);
    }

    /**
     * Sets value at path. See {@link Entity} for a list of properties.
     *
     * @param path - The path
     * @param value - The value
     * @returns Whether the value was set
     * @example
     * ```javascript
     * entity.set('position', [1, 0, 0]);
     * ```
     */
    set(path: string, value: any) {
        return this._observer.set(path, value);
    }

    /**
     * Unsets value at path. See {@link Entity} for a list of properties.
     *
     * @param path - The path
     * @returns Whether the value was unset
     * @example
     * ```javascript
     * entity.unset('components.model');
     * ```
     */
    unset(path: string) {
        return this._observer.unset(path);
    }

    /**
     * Inserts value in array at path, at specified index. See {@link Entity} for a list of properties.
     *
     * @param path - The path
     * @param value - The value
     * @param index - The index (if undefined the value will be inserted in the end)
     * @returns Whether the value was inserted
     * @example
     * ```javascript
     * entity.insert('tags', 'a_tag');
     * ```
     */
    insert(path: string, value: any, index?: number) {
        return this._observer.insert(path, value, index);
    }

    /**
     * Remove value from array at path. See {@link Entity} for a list of properties.
     *
     * @param path - The path
     * @param value - The value
     * @returns Whether the value was removed
     * @example
     * ```javascript
     * entity.removeValue('tags', 'a_tag');
     * ```
     */
    removeValue(path: string, value: any) {
        return this._observer.removeValue(path, value);
    }

    /**
     * Returns JSON representation of entity data
     *
     * @returns - The data
     * ```javascript
     * console.log(entity.json());
     * ```
     */
    json() {
        return this._observer.json();
    }

    /**
     * Returns a JSON representation of entity data. The children array
     * of the entity gets recursively converted to an array of entity data
     * instead of containing children resource ids.
     *
     * @returns - The data
     * @example
     * ```javascript
     * const data = entity.jsonHierarchy();
     * console.log(data.children[0].name);
     * ```
     */
    jsonHierarchy() {
        const result = this.json() as any;
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            result.children[i] = children[i] && children[i].jsonHierarchy();
        }

        return result;
    }

    /**
     * Returns true if this entity is a descendant of the specified parent entity.
     *
     * @param parent - The parent
     * @returns True if it is
     */
    isDescendantOf(parent: Entity) {
        let p = this.parent;
        while (p) {
            if (p === parent) {
                return true;
            }

            p = p.parent;
        }

        return false;
    }

    /**
     * Finds first entity by name using depth-first search
     *
     * @param name - The name
     * @returns The entity
     * @example
     * ```javascript
     * const door = editor.entities.root.findByName('Door');
     * ```
     */
    findByName(name: string): Entity | null {
        if (this.get('name') === name) {
            return this;
        }

        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child) {
                const found = child.findByName(name);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    }

    /**
     * Finds all entities with specified tags
     *
     * @param tags - The tags. If multiple tags are specified then entities that contain ANY of the specified
     * tags will be included. If an argument is an array of tags then entities that contain ALL of the tags in the array will be included.
     * @returns The entities
     * @example
     * ```javascript
     * // entities that have the following tag
     * const entities = editor.entities.root.listByTag('tag');
     * // entities that have any of the following tags
     * const entities = editor.entities.root.listByTag('tag', 'tag2');
     * // entities that have all of the following tags
     * const entities = editor.entities.root.listByTag(['tag', 'tag2']);
     * ```
     */
    listByTag(...tags: any[]) {
        return this.filter((entity: Entity) => {
            const t = entity.get('tags');
            for (let i = 0; i < tags.length; i++) {
                if (Array.isArray(tags[i])) {
                    let countTags = 0;
                    for (let j = 0; j < tags[i].length; j++) {
                        if (t.includes(tags[i][j])) {
                            countTags++;
                        } else {
                            break;
                        }
                    }

                    if (countTags === tags[i].length) {
                        return true;
                    }
                } else {
                    if (t.includes(tags[i])) {
                        return true;
                    }
                }
            }

            return false;
        });
    }

    /**
     * Returns the entity and children that satisfy the function
     *
     * @param fn - A function that takes an Entity and returns whether it should be included
     * in the result
     * @returns The result
     * @example
     * ```javascript
     * const doors = editor.entities.root.filter(entity => entity.get('name').startsWith('door'));
     * ```
     */
    filter(fn: (entity: Entity) => boolean): Entity[] {
        let result: Entity[] = [];

        if (fn(this)) {
            result.push(this);
        }

        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child) {
                result = result.concat(child.filter(fn));
            }
        }

        return result;
    }

    /**
     * Executes function for this entity and its children in depth first order.
     *
     * @param fn - A function that takes an entity as an argument
     * @example
     * ```javascript
     * // get a list of all entities in the graph in depth first order
     * const entities = [];
     * editor.entities.root.depthFirst(entity => entities.push(entity));
     * ```
     */
    depthFirst(fn: (entity: Entity) => void) {
        fn(this);

        const children = this.children;
        children.forEach((child: Entity) => {
            if (child) {
                child.depthFirst(fn);
            } else {
                fn(child);
            }
        });
    }

    /**
     * Adds a component to this Entity
     *
     * @param component - The component name
     * @param data - Default component data. Defaults values will be used for any missing fields.
     * For details on component properties see {@link Entity}.
     * @example
     * ```javascript
     * editor.entities.root.addComponent('model', {
     *     type: 'box'
     * });
     * ```
     */
    addComponent(component: string, data = {}) {
        const defaultData = api.schema.components.getDefaultData(component);
        const componentData = Object.assign(defaultData, data);
        this.set(`components.${component}`, componentData);
    }

    /**
     * Removes a component from this Entity
     *
     * @param component - The component name
     * @example
     * ```javascript
     * editor.entities.root.removeComponent('model');
     * ```
     */
    removeComponent(component: string) {
        this.unset(`components.${component}`);
    }

    /**
     * Adds entity as a child
     *
     * @category Internal
     * @param entity - The entity
     * @returns Whether the child was added
     */
    addChild(entity: Entity) {
        return this.insertChild(entity);
    }

    /**
     * Inserts entity as a child at specified index.
     *
     * @category Internal
     * @param entity - The entity
     * @param index - The index. If undefined the child will be added in the end.
     * @returns Whether the child was added
     */
    insertChild(entity: Entity, index: number | undefined = undefined) {
        let history = this.history.enabled;
        this.history.enabled = false;
        const result = this.insert('children', entity.get('resource_id'), index);
        this.history.enabled = history;

        // BUG TRACKING: missing children
        if (!api.entities.get(entity.get('resource_id'))) {
            console.error(`BUG TRACKING: inserting missing child guid ${entity.get('resource_id')} to parent ${this.get('resource_id')}`);
        }

        if (result) {
            history = entity.history.enabled;
            entity.history.enabled = false;
            entity.set('parent', this.get('resource_id'));
            entity.history.enabled = history;
            return true;
        }

        console.error(`Cannot add duplicate child ${entity.get('resource_id')} under parent ${this.get('resource_id')}`);
        return false;
    }

    /**
     * Removes entity from children
     *
     * @category Internal
     * @param entity - The entity
     */
    removeChild(entity: Entity) {
        let history = entity.history.enabled;
        entity.history.enabled = false;
        try {
            entity.observer.set('parent', null, true); // silent set otherwise we run into C3 error
        } catch (err) {
            console.error(`Error when setting parent to null for entity ${entity.get('resource_id')}`);
            console.error(err);
        }
        entity.history.enabled = history;

        history = this.history.enabled;
        this.history.enabled = false;
        try {
            this.removeValue('children', entity.get('resource_id'));
        } catch (err) {
            console.error(`Error when removing ${entity.get('resource_id')} from children of entity ${this.get('resource_id')}`);
            console.error(err);
        }
        this.history.enabled = history;
    }

    /**
     * Deletes entity (and its children)
     *
     * @param options.history - Whether to record a history action. Defaults to true.
     * @returns A promise
     * @example
     * ```javascript
     * editor.entities.root.findByName('door').delete();
     * ```
     *
     */
    delete(options: { history?: boolean } = {}) {
        return api.entities.delete([this], options);
    }

    /**
     * Reparents entity under new parent
     *
     * @param parent - The new parent
     * @param index - The desired index. If undefined the entity will be added at the end of the parent's children.
     * @param options.history - Whether to record a history action. Defaults to true.
     * @param options.preserveTransform - Whether to preserve the original transform after reparenting
     * @example
     * ```javascript
     * const redHouse = editor.entities.root.findByName('red house');
     * const greenHouse = editor.entities.root.findByName('green house');
     * const door = redHouse.findByName('door');
     * door.reparent(greenHouse);
     * ```
     */
    reparent(parent: Entity, index: number | null = null, options: { history?: boolean, preserveTransform?: boolean } = {}) {
        api.entities.reparent([{
            entity: this,
            parent: parent,
            index: index
        }], options);
    }

    /**
     * Duplicates entity under the same parent
     *
     * @param options.history - Whether to record a history action. Defaults to true.
     * @param options.select - Whether to select the new entity. Defaults to false.
     * @param options.rename - Whether to rename the duplicated entity. Defaults to false.
     * @returns The new entity
     */
    async duplicate(options: { history?: boolean, select?: boolean, rename?: boolean } = {}) {
        const result = await api.entities.duplicate([this], options);
        return result[0];
    }

    /**
     * Returns the latest version of the Entity from the Entities API.
     *
     * @returns The entity
     */
    latest() {
        return api.entities.get(this._observer.get('resource_id'));
    }

    /**
     * Adds a script to the script component of this entity.
     * If a script component does not exist, this method will add the script
     * component as well.
     *
     * @param scriptName - The name of the script.
     * @param options.attributes - The values of attributes. Each key is the name
     * of the attributes and each value is the value for that attribute. Leave undefined to
     * let the Editor set default values depending on the attribute types.
     * @param options.history - Whether to add a history action. Defaults to true.
     * @param options.index - The desired index in the entity's scripts order to add this script.
     * @returns A promise
     */
    addScript(scriptName: string, options: { attributes?: object, history?: boolean, index?: number } = {}) {
        return api.entities.addScript([this], scriptName, options);
    }

    /**
     * Removes a script from the entity's script component.
     *
     * @param scriptName - The name of the script.
     * @param options.history - Whether to record a history action. Defaults to true.
     */
    removeScript(scriptName: string, options: { history?: boolean } = {}) {
        api.entities.removeScript([this], scriptName, options);
    }

    /**
     * The observer object for this entity.
     */
    get observer() {
        return this._observer;
    }

    /**
     * The parent entity.
     */
    get parent() {
        const id = this.get('parent');
        return (id ? api.entities.get(id) : null) as Entity;
    }

    /**
     * The children entities. Warning: this creates a new array every time it's called.
     */
    get children() {
        return this.get('children').map((id: string) => api.entities.get(id)) as Entity[];
    }

    /**
     * The history object for this entity.
     */
    get history() {
        return this._history as ObserverHistory;
    }

    /**
     * The entity in the 3D viewport of the Editor.
     */
    get viewportEntity() {
        return (this._observer ? (this._observer as any).entity : null) as any;
    }
}

export { Entity };
