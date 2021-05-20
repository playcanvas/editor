editor.once('load', function () {
    'use strict';

    // Indexes all entities with scripts
    // When primary script is set, update attributes on entities components
    // When script attributes change, update attributes on entities components
    var EntitiesScriptsIndex = function () {
        this._index = {};
    };

    // Returns a list of entities that have the specified script name
    EntitiesScriptsIndex.prototype.listEntitiesByScript = function (script) {
        var result = [];
        var entry = this._index[script];
        if (entry) {
            for (const key in entry) {
                result.push(entry[key].entity);
            }
        }

        return result;
    };

    // Adds an entry into the index when the specified
    // script name has been added to the specified entity.
    EntitiesScriptsIndex.prototype.add = function (entity, script) {
        var index = this._index;

        if (!index[script])
            index[script] = {};

        if (index[script][entity.get('resource_id')])
            return;

        index[script][entity.get('resource_id')] = {
            entity: entity,
            asset: null,
            events: []
        };
    };

    // When the specified script is removed from the specified entity
    // remove it from the index
    EntitiesScriptsIndex.prototype.remove = function (entity, script) {
        var index = this._index;

        if (!index[script])
            return;

        var item = index[script][entity.get('resource_id')];

        if (!item) return;

        for (let i = 0; i < item.events.length; i++)
            item.events[i].unbind();

        delete index[script][entity.get('resource_id')];

        if (Object.keys(index[script]).length === 0) {
            delete index[script];
        }
    };

    // Called when a new entity is added. Adds the entity to the index
    // and subscribes to component script events
    EntitiesScriptsIndex.prototype.onEntityAdd = function (entity) {
        var self = this;

        var scripts = entity.get('components.script.order');
        if (scripts) {
            for (let i = 0; i < scripts.length; i++) {
                self.add(entity, scripts[i]);
            }
        }

        entity.on('components.script.order:insert', function (script, index, remote) {
            self.add(entity, script);

            if (!remote && editor.call('permissions:write')) {
                self.setDefaultAttrs(entity, script);
            }
        });

        entity.on('components.script.order:remove', function (script) {
            self.remove(entity, script);
        });

        entity.on('components.script:unset', function (scriptComponent) {
            var scriptOrder = scriptComponent && scriptComponent.order;
            if (scriptOrder) {
                var i = scriptOrder.length;
                while (i--) {
                    self.remove(entity, scriptOrder[i]);
                }
            }
        });
    };

    EntitiesScriptsIndex.prototype.setDefaultAttrs = function (entity, script) {
        const h = {
            script_task_type: 'set_entity_defaults',
            job_id: editor.call('utils:makeGuid'),
            project_id: config.project.id,
            branch_id: config.self.branch.id,
            script_added_to_ent: script,
            dst_scene_id: config.scene.id,
            dst_ent_id: entity.get('resource_id')
        };

        editor.call('realtime:send', 'pipeline', {
            name: 'script-attributes',
            data: h
        });
    };

    // Called when an entity is removed to remove the entity from the index
    EntitiesScriptsIndex.prototype.onEntityRemove = function (entity) {
        var scripts = entity.get('components.script.order');
        if (scripts) {
            var i = scripts.length;
            while (i--) {
                this.remove(entity, scripts[i]);
            }
        }
    };

    // create a new instance of the index
    var entitiesScriptsIndex = new EntitiesScriptsIndex();

    // register event listeners
    editor.on('entities:add', function (entity) {
        entitiesScriptsIndex.onEntityAdd(entity);
    });

    editor.on('entities:remove', function (entity) {
        entitiesScriptsIndex.onEntityRemove(entity);
    });

    editor.method('entities:list:byScript', function (script) {
        return entitiesScriptsIndex.listEntitiesByScript(script);
    });
});
