import type { Observer } from '@playcanvas/observer';

editor.once('load', () => {
    // Indexes all entities with scripts
    // When primary script is set, update attributes on entities components
    // When script attributes change, update attributes on entities components
    class EntitiesScriptsIndex {
        _index: any = {};

        // Returns a list of entities that have the specified script name
        listEntitiesByScript(script: string) {
            const result = [];
            const entry = this._index[script];
            if (entry) {
                for (const key in entry) {
                    result.push(entry[key].entity);
                }
            }

            return result;
        }

        // Adds an entry into the index when the specified
        // script name has been added to the specified entity.
        add(entity: Observer, script: string) {
            const index = this._index;

            if (!index[script]) {
                index[script] = {};
            }

            if (index[script][entity.get('resource_id')]) {
                return;
            }

            index[script][entity.get('resource_id')] = {
                entity: entity,
                asset: null,
                events: []
            };
        }

        // When the specified script is removed from the specified entity
        // remove it from the index
        remove(entity: Observer, script: string) {
            const index = this._index;

            if (!index[script]) {
                return;
            }

            const item = index[script][entity.get('resource_id')];

            if (!item) {
                return;
            }

            for (let i = 0; i < item.events.length; i++) {
                item.events[i].unbind();
            }

            delete index[script][entity.get('resource_id')];

            if (Object.keys(index[script]).length === 0) {
                delete index[script];
            }
        }

        // Called when a new entity is added. Adds the entity to the index
        // and subscribes to component script events
        onEntityAdd(entity: Observer) {
            const self = this;

            const scripts = entity.get('components.script.order');
            if (scripts) {
                for (let i = 0; i < scripts.length; i++) {
                    self.add(entity, scripts[i]);
                }
            }

            entity.on('components.script.order:insert', (script, index, remote) => {
                self.add(entity, script);
            });

            entity.on('components.script.order:remove', (script) => {
                self.remove(entity, script);
            });

            entity.on('components.script:unset', (scriptComponent) => {
                const scriptOrder = scriptComponent && scriptComponent.order;
                if (scriptOrder) {
                    let i = scriptOrder.length;
                    while (i--) {
                        self.remove(entity, scriptOrder[i]);
                    }
                }
            });
        }

        // Called when an entity is removed to remove the entity from the index
        onEntityRemove(entity: Observer) {
            const scripts = entity.get('components.script.order');
            if (scripts) {
                let i = scripts.length;
                while (i--) {
                    this.remove(entity, scripts[i]);
                }
            }
        }
    }

    // create a new instance of the index
    const entitiesScriptsIndex = new EntitiesScriptsIndex();

    // register event listeners
    editor.on('entities:add', (entity) => {
        entitiesScriptsIndex.onEntityAdd(entity);
    });

    editor.on('entities:remove', (entity) => {
        entitiesScriptsIndex.onEntityRemove(entity);
    });

    editor.method('entities:list:byScript', (script) => {
        return entitiesScriptsIndex.listEntitiesByScript(script);
    });
});
