editor.once('load', function () {
    'use strict';

    // Default values per script attribute type
    var DEFAULTS = utils.deepCopy(pcui.DEFAULTS);

    // The expected typeof value for each script attribute type
    var TYPES = {
        boolean: 'boolean',
        number: 'number',
        string: 'string',
        json: 'object',
        asset: 'number',
        entity: 'string',
        rgb: 'object',
        rgba: 'object',
        vec2: 'object',
        vec3: 'object',
        vec4: 'object',
        curve: 'object',
        gradient: 'object'
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
        if (Object.keys(index[script]).length === 0) {
            delete index[script];
        }

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

    EntitiesScriptsIndex.prototype._isNewDefaultValueRequired = function (attribute, oldAttribute, currentValue) {
        var result = false;

        if (attribute.type !== oldAttribute.type || (!!attribute.array !== !!oldAttribute.array)) {
            result = true;
        } else if (currentValue === undefined) {
            result = true;
        } else if (attribute.type === 'json' && !this._areEqual(attribute.schema, oldAttribute.schema, 'json')) {
            result = true;
        } else {
            var oldDefaultValue = this._getDefaultAttributeValue(oldAttribute);

            result = this._areEqual(currentValue, oldDefaultValue, attribute.type);

            // curve types
            if (!result && attribute.type === 'curve') {
                if (attribute.color || attribute.curves) {
                    var len = attribute.color ? attribute.color.length : attribute.curves.length;
                    if (attribute.array) {
                        if (!currentValue || (!(currentValue instanceof Array))) {
                            result = true;
                        } else {
                            for (var j = 0; j < currentValue.length && !result; j++) {
                                var val = currentValue[j];
                                if (len !== 1 && (!(val.keys[0] instanceof Array) || val.keys.length !== len)) {
                                    result = true;
                                } else if (len === 1 && (val.keys[0] instanceof Array)) {
                                    result = true;
                                }
                            }
                        }
                    } else {
                        if (len !== 1 && (!(currentValue.keys[0] instanceof Array) || currentValue.keys.length !== len)) {
                            result = true;
                        } else if (len === 1 && (currentValue.keys[0] instanceof Array)) {
                            result = true;
                        }
                    }

                } else if (!currentValue || !currentValue.keys || currentValue.keys[0] instanceof Array) {
                    result = true;
                }
            }
        }

        return result;
    };

    // Checks if the specified value equals the default attribute value
    EntitiesScriptsIndex.prototype._areEqual = function (value, defaultValue, type) {
        if (typeof value !== typeof defaultValue && defaultValue !== null) {
            return false;
        }

        if (type === 'json') {
            try {
                return JSON.stringify(value) === JSON.stringify(defaultValue);
            } catch (err) {
            }

            return false;
        }

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

    EntitiesScriptsIndex.prototype._getNewDefaultValueForJsonFieldIfNeeded = function (attribute, oldAttribute, currentValue) {
        const result = this._getDefaultAttributeValue(attribute);

        const newSchemaIndex = {};
        attribute.schema.forEach(field => {
            newSchemaIndex[field.name] = field;
        });

        // go through all fields from the old schema and if they exist
        // in the new value update those values to the new values
        oldAttribute.schema.forEach(field => {
            if (newSchemaIndex.hasOwnProperty(field.name) && currentValue.hasOwnProperty(field.name)) {
                if (!this._isNewDefaultValueRequired(newSchemaIndex[field.name], field, currentValue[field.name])) {
                    result[field.name] = utils.deepCopy(currentValue[field.name]);
                }
            }
        });

        return result;
    };

    EntitiesScriptsIndex.prototype._setNewDefaultAttributeValueIfNeeded = function (entity, script, name, attribute, oldAttribute) {
        if (! oldAttribute) {
            oldAttribute = attribute;
        }

        const attributesPath = `components.script.scripts.${script}.attributes`;
        var path = `${attributesPath}.${name}`;
        var currentValue = entity.has(path) ? entity.get(path) : undefined;

        let newDefaultValue;

        if (this._isNewDefaultValueRequired(attribute, oldAttribute, currentValue)) {
            // in case of json attributes if there was a previous json value we want to
            // avoid resetting the whole value but instead add / remove / update existing fields
            if (attribute.type === 'json' && oldAttribute.type === 'json' && attribute.array === oldAttribute.array && currentValue) {
                if (oldAttribute.array) {
                    if (currentValue.length) {
                        newDefaultValue = [];

                        var attributeCopy = Object.assign({}, attribute);
                        attributeCopy.array = false;
                        var oldAttributeCopy = Object.assign({}, oldAttribute);
                        oldAttributeCopy.array = false;
                        for (let i = 0; i < currentValue.length; i++) {
                            if (!currentValue[i]) {
                                newDefaultValue.push(currentValue[i]);
                                continue;
                            }


                            newDefaultValue.push(this._getNewDefaultValueForJsonFieldIfNeeded(attributeCopy, oldAttributeCopy, currentValue[i]));
                        }
                    }
                } else {
                    newDefaultValue = this._getNewDefaultValueForJsonFieldIfNeeded(attribute, oldAttribute, currentValue);
                }
            }

            var history = entity.history.enabled;
            entity.history.enabled = false;
            if (newDefaultValue === undefined) {
                newDefaultValue = this._getDefaultAttributeValue(attribute);
            }
            // fix undefined attributes - if entity has undefined
            // attributes (not sure how that happens yet) then setting
            // an attribute will just cause an error. So set attributes to
            // an empty object first.
            if (!entity.has(attributesPath)) {
                entity.set(attributesPath, {});
            }
            entity.set(path, newDefaultValue);
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
            } else if (typeof value === 'object') {
                value = utils.deepCopy(value);
            }

            if (attribute.type === 'curve') {
                if (attribute.array) {
                    value = [];
                } else {
                    if (attribute.color || attribute.curves) {
                        var len = attribute.color ? attribute.color.length : attribute.curves.length;
                        var v = attribute.color ? 1 : 0;
                        value.keys = [];
                        for (var c = 0; c < len; c++) {
                            value.keys.push([0, v]);
                        }
                    }
                }
            } else if (attribute.type === 'json') {
                if (attribute.array) {
                    value = [];
                } else {
                    // handle json attribute by creating a default instance of the schema
                    if (attribute.schema) {
                        value = {};
                        attribute.schema.forEach(field => {
                            value[field.name] = this._getDefaultAttributeValue(field);
                        });
                    }
                }
            }
        }

        return value;
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
