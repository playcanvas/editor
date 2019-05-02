editor.once('load', function () {
    'use strict';

    // Default values per script attribute type
    var DEFAULTS = {
        boolean: false,
        number: 0,
        string: '',
        json: '{ }',
        asset: null,
        entity: null,
        rgb: [1, 1, 1],
        rgba: [1, 1, 1, 1],
        vec2: [0, 0],
        vec3: [0, 0, 0],
        vec4: [0, 0, 0, 0],
        curve: { keys: [0, 0], type: CURVE_SPLINE }
    };

    // The expected typeof value for each script attribute type
    var TYPES = {
        boolean: 'boolean',
        number: 'number',
        string: 'string',
        json: 'string',
        asset: 'number',
        entity: 'string',
        rgb: 'object',
        rgba: 'object',
        vec2: 'object',
        vec3: 'object',
        vec4: 'object',
        curve: 'object'
    };

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
            for (var key in entry) {
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

        this._updateAllAttributes(entity, script);
    };

    // When the specified script is removed from the specified entity
    // remove it from the index
    EntitiesScriptsIndex.prototype.remove = function (entity, script) {
        var index = this._index;

        if (!index[script])
            return;

        var item = index[script][entity.get('resource_id')];
        if (!item) return;

        for (var i = 0; i < item.events.length; i++)
            item.events[i].unbind();

        delete index[script][entity.get('resource_id')];
        if (Object.keys(index[script]).length === 0)
            delete index[script];
    };

    EntitiesScriptsIndex.prototype._updateAllAttributes =  function (entity, script) {
        var asset = editor.call('assets:scripts:assetByScript', script);
        if (!asset) return;

        var i;
        var history;
        var index = this._index;
        var item = index[script][entity.get('resource_id')];
        var assetOld = null;

        // clean up old item.asset if it points to a different script asset
        if (item.asset && item.asset !== asset.get('id')) {
            assetOld = item.asset;

            for (i = 0; i < item.events.length; i++)
                item.events[i].unbind();

            item.events = [];
            item.asset = asset.get('id');
        }

        // unset attributes
        var attributes = entity.get('components.script.scripts.' + script + '.attributes');
        for (var key in attributes) {
            if (!attributes.hasOwnProperty(key))
                continue;

            if (!asset.has('data.scripts.' + script + '.attributes.' + key)) {
                history = entity.history.enabled;
                entity.history.enabled = false;
                entity.unset('components.script.scripts.' + script + '.attributes.' + key);
                entity.history.enabled = history;
            }
        }

        // set/update attributes
        var attributesOrder = asset.get('data.scripts.' + script + '.attributesOrder');
        for (i = 0; i < attributesOrder.length; i++) {
            var name = attributesOrder[i];
            var attribute = asset.get('data.scripts.' + script + '.attributes.' + name);

            var oldAttribute = null;
            if (assetOld) {
                oldAttribute = assetOld.get('data.scripts.' + script + '.attributes.' + name);
            }

            this._setNewDefaultAttributeValueIfNeeded(entity, script, name, attribute, oldAttribute);
        }

        // subscribe to script asset attribute changes
        // set attribute
        var self = this;
        item.events.push(asset.on('*:set', function (path, attribute, old) {
            self._onSetAssetField(entity, script, path, attribute, old);

        }));
        // unset attribute
        item.events.push(asset.on('*:unset', function (path, attribute) {
            self._onUnsetAssetField(entity, script, path, attribute);
        }));
    };

    EntitiesScriptsIndex.prototype._setNewDefaultAttributeValueIfNeeded = function (entity, script, name, attribute, oldAttribute) {
        if (! oldAttribute) {
            oldAttribute = attribute;
        }

        var setNewDefaultValue = false;
        var oldDefaultValue = this._getDefaultAttributeValue(oldAttribute);

        if (entity.has('components.script.scripts.' + script + '.attributes.' + name)) {
            // update attribute
            var value = entity.get('components.script.scripts.' + script + '.attributes.' + name);
            setNewDefaultValue = this._isValueEqualToOldDefault(value, oldDefaultValue);

            // value type
            if (!setNewDefaultValue && ((typeof (value) !== typeof (oldDefaultValue) && oldDefaultValue !== null) || attribute.type !== oldAttribute.type || attribute.array !== oldAttribute.array)) {
                setNewDefaultValue = true;
            }

            // curve types
            if (!setNewDefaultValue && attribute.type === 'curve') {
                if (attribute.color || attribute.curves) {
                    var len = attribute.color ? attribute.color.length : attribute.curves.length;
                    if (attribute.array) {
                        if (!value || (!(value instanceof Array))) {
                            setNewDefaultValue = true;
                        } else {
                            for (var j = 0; j < value.length && !setNewDefaultValue; j++) {
                                var val = value[j];
                                if (len !== 1 && (!(val.keys[0] instanceof Array) || val.keys.length !== len)) {
                                    setNewDefaultValue = true;
                                } else if (len === 1 && (val.keys[0] instanceof Array)) {
                                    setNewDefaultValue = true;
                                }
                            }
                        }
                    } else {
                        if (len !== 1 && (!(value.keys[0] instanceof Array) || value.keys.length !== len)) {
                            setNewDefaultValue = true;
                        } else if (len === 1 && (value.keys[0] instanceof Array)) {
                            setNewDefaultValue = true;
                        }
                    }

                } else if (value.keys[0] instanceof Array) {
                    setNewDefaultValue = true;
                }
            }
        } else {
            // set new attribute
            setNewDefaultValue = true;
        }

        if (setNewDefaultValue) {
            var newDefaultValue = this._getDefaultAttributeValue(attribute);
            var history = entity.history.enabled;
            entity.history.enabled = false;
            entity.set('components.script.scripts.' + script + '.attributes.' + name, newDefaultValue);
            entity.history.enabled = history;
        }
    };

    // Returns a new default value for the specified attribute
    EntitiesScriptsIndex.prototype._getDefaultAttributeValue = function (attribute) {
        var value = attribute.array ? [] : null;

        if (attribute.default !== undefined && attribute.default !== null) {
            if (attribute.array) {
                if (attribute.default instanceof Array) {
                    value = attribute.default;
                    for (var i = 0; i < attribute.default.length; i++) {
                        if (typeof (attribute.default[i]) !== TYPES[attribute.type]) {
                            value = [];
                            break;
                        }
                    }
                }
            } else if (typeof (attribute.default) === TYPES[attribute.type]) {
                value = attribute.default;
            }
        }

        if (value === null) {
            value = DEFAULTS[attribute.type];
            if (value instanceof Array) {
                value = value.slice(0);
            }

            if (attribute.type === 'curve') {
                if (attribute.array) {
                    value = [];
                } else {
                    value = utils.deepCopy(value);
                    if (attribute.color || attribute.curves) {
                        var len = attribute.color ? attribute.color.length : attribute.curves.length;
                        var v = attribute.color ? 1 : 0;
                        value.keys = [];
                        for (var c = 0; c < len; c++) {
                            value.keys.push([0, v]);
                        }
                    }
                }
            }
        }

        return value;
    };

    // Checks if the specified value equals the default attribute value
    EntitiesScriptsIndex.prototype._isValueEqualToOldDefault = function (value, defaultValue) {
        if ((defaultValue instanceof Array) && (value instanceof Array) && defaultValue.equals(value)) {
            // was default array value
            return true;
        } else if ((defaultValue instanceof Object) && (value instanceof Object) && defaultValue.type === value.type && (defaultValue.keys instanceof Array) && (value.keys instanceof Array) && defaultValue.keys.length === value.keys.length) {
            if ((defaultValue.keys[0] instanceof Array) && (value.keys[0] instanceof Array)) {
                for (var k = 0; k < defaultValue.keys.length; k++) {
                    if (!defaultValue.keys[k].equals(value.keys[k])) {
                        // was curveset default value
                        return false;
                    }
                }
                return true;
            } else if (defaultValue.keys.equals(value.keys)) {
                // was curve default value
                return true;
            }
        } else if (defaultValue === value) {
            // was default value
            return true;
        }
        return false;
    };

    // Called when a new entity is added. Adds the entity to the index
    // and subscribes to component script events
    EntitiesScriptsIndex.prototype.onEntityAdd = function (entity) {
        var self = this;

        var scripts = entity.get('components.script.order');
        if (scripts) {
            for (var i = 0; i < scripts.length; i++) {
                self.add(entity, scripts[i]);
            }
        }

        entity.on('components.script.order:insert', function (script) {
            self.add(entity, script);
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

    // Called when the primary script is set
    EntitiesScriptsIndex.prototype.onSetPrimaryScript = function (asset, script) {
        var index = this._index;
        if (!index[script])
            return;

        for (var key in index[script]) {
            if (!index[script].hasOwnProperty(key))
                continue;

            this._updateAllAttributes(index[script][key].entity, script);
        }
    };

    // Handles setting the script attributes on a script asset
    EntitiesScriptsIndex.prototype._onSetAssetField = function (entity, script, path, attribute, oldAttribute) {
        if (!path.startsWith('data.scripts.' + script + '.attributes.'))
            return;

        var parts = path.split('.');
        if (parts.length !== 5)
            return;

        var name = parts[4];

        this._setNewDefaultAttributeValueIfNeeded(entity, script, name, attribute, oldAttribute);
    };

    // Handled unsetting script attributes from a script asset
    EntitiesScriptsIndex.prototype._onUnsetAssetField = function (entity, script, path, attribute) {
        if (!path.startsWith('data.scripts.' + script + '.attributes.'))
            return;

        var parts = path.split('.');
        if (parts.length !== 5)
            return;

        var name = parts[4];

        if (!entity.has('components.script.scripts.' + script + '.attributes.' + name))
            return;

        var history = entity.history.enabled;
        entity.history.enabled = false;
        entity.unset('components.script.scripts.' + script + '.attributes.' + name);
        entity.history.enabled = history;
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

    editor.on('assets:scripts:primary:set', function (asset, script) {
        entitiesScriptsIndex.onSetPrimaryScript(asset, script);
    });

    editor.method('entities:list:byScript', function (script) {
        return entitiesScriptsIndex.listEntitiesByScript(script);
    });
});
