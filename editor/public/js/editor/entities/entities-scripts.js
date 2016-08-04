editor.once('load', function() {
    'use strict';

    // index all entities with scripts
    // when primary script set, update attributes on entities component
    // when script attributes change, update attributes on entities component

    var index = { };
    var defaults = {
        boolean: false,
        number: 0,
        string: '',
        json: '{ }',
        asset: null,
        entity: null,
        rgb: [ 1, 1, 1 ],
        rgba: [ 1, 1, 1, 1 ],
        vec2: [ 0, 0 ],
        vec3: [ 0, 0, 0 ],
        vec4: [ 0, 0, 0, 0 ],
        curve: { keys: [ 0, 0 ], type: 2 }
    };


    var indexAdd = function(entity, script) {
        if (! index[script])
            index[script] = { };

        if (index[script][entity.get('resource_id')])
            return;

        index[script][entity.get('resource_id')] = {
            entity: entity,
            asset: null,
            events: [ ]
        };

        updateAttributes(entity, script);
    };
    var indexRemove = function(entity, script) {
        if (! index[script])
            return;

        var item = index[script][entity.get('resource_id')];
        if (! item) return;

        for(var i = 0; i < item.events.length; i++)
            item.events[i].unbind();

        delete index[script][entity.get('resource_id')];
        if (Object.keys(index[script]).length === 0)
            delete index[script];
    };
    var attributeValue = function(attribute) {
        var value = null;
        if (attribute.default === undefined) {
            if (attribute.array) {
                value = [ ];
            } else {
                value = defaults[attribute.type];
                if (value instanceof Array)
                    value = value.slice(0);

                if (attribute.type === 'curve') {
                    value = {
                        keys: [ 0, 0 ],
                        type: 2
                    };
                    if (attribute.color || attribute.curves) {
                        var len = attribute.color ? attribute.color.length : attribute.curves.length;
                        value.keys = [ ];
                        for(var c = 0; c < len; c++)
                            value.keys.push([ 0, 0 ]);
                    }
                }
            }
        } else {
            value = attribute.default;
        }
        return value;
    };
    var attributeDefaultValue = function(value, attribute) {
        var old = attributeValue(attribute);

        if ((old instanceof Array) && (value instanceof Array) && old.equals(value)) {
            // was default array value
            return true;
        } else if ((old instanceof Object) && (value instanceof Object) && old.type === value.type && (old.keys instanceof Array) && (value.keys instanceof Array) && old.keys.length === value.keys.length) {
            if ((old.keys[0] instanceof Array) && (value.keys[0] instanceof Array)) {
                for(var k = 0; k < old.keys.length; k++) {
                    if (! old.keys[k].equals(value.keys[k])) {
                        // was curveset default value
                        return false;
                    }
                }
                return true;
            } else if (old.keys.equals(value.keys)) {
                // was curve default value
                return true;
            }
        } else if (old === value) {
            // was default value
            return true;
        }
        return false;
    };
    var updateAttributes = function(entity, script) {
        var asset = editor.call('assets:scripts:assetByScript', script);
        if (! asset)
            return;

        var item = index[script][entity.get('resource_id')];
        var assetOld = null;
        if (item.asset && item.asset !== asset.get('id')) {
            assetOld = item.asset;

            for(var i = 0; i < item.events.length; i++)
                item.events[i].unbind();

            item.events = [ ];
            item.asset = asset.get('id');
        }

        // unset attributes
        var attributes = entity.get('components.script.scripts.' + script + '.attributes');
        for(var key in attributes) {
            if (! attributes.hasOwnProperty(key))
                continue;

            if (! asset.has('data.scripts.' + script + '.attributes.' + key)) {
                var history = entity.history.enabled;
                entity.history.enabled = false;
                entity.unset('components.script.scripts.' + script + '.attributes.' + key);
                entity.history.enabled = history;
            }
        }

        // set/update attributes
        var attributesOrder = asset.get('data.scripts.' + script + '.attributesOrder');
        for(var i = 0; i < attributesOrder.length; i++) {
            var name = attributesOrder[i];
            var setAttribute = false;
            var attribute = asset.get('data.scripts.' + script + '.attributes.' + name);
            var valueDefault = attributeValue(attribute);

            if (entity.has('components.script.scripts.' + script + '.attributes.' + name)) {
                // update attribute
                var value = entity.get('components.script.scripts.' + script + '.attributes.' + name);
                var attr = null;
                if (assetOld) attr = assetOld.get('data.scripts.' + script + '.attributes.' + name);
                if (! attr) attr = attribute;
                setAttribute = attributeDefaultValue(value, attr);

                // value type
                if (! setAttribute && ((typeof(value) !== typeof(valueDefault) && valueDefault !== null) || attribute.type !== attr.type))
                    setAttribute = true;

                // curve types
                if (! setAttribute && attribute.type === 'curve') {
                    if (attribute.color || attribute.curves) {
                        var len = attribute.color ? attribute.color.length : attribute.curves.length;
                        if (len !== 1 && (! (value.keys[0] instanceof Array) || value.keys.length !== len)) {
                            setAttribute = true;
                        } else if (len === 1 && (value.keys[0] instanceof Array)) {
                            setAttribute = true;
                        }
                    } else if (value.keys[0] instanceof Array) {
                        setAttribute = true;
                    }
                }
            } else {
                // set new attribute
                setAttribute = true;
            }

            if (setAttribute) {
                var history = entity.history.enabled;
                entity.history.enabled = false;
                entity.set('components.script.scripts.' + script + '.attributes.' + name, valueDefault);
                entity.history.enabled = history;
            }
        }

        // subscribe to script asset attribute changes
        // set attribute
        item.events.push(asset.on('*:set', function(path, attribute, old) {
            if (! path.startsWith('data.scripts.' + script + '.attributes.'))
                return;

            var parts = path.split('.');
            if (parts.length !== 5)
                return;

            var name = parts[4];
            var setAttribute = false;

            if (entity.has('components.script.scripts.' + script + '.attributes.' + name)) {
                var value = entity.get('components.script.scripts.' + script + '.attributes.' + name);
                setAttribute = ! old || attributeDefaultValue(value, old);

                // value type
                if (! setAttribute && (typeof(value) !== typeof(valueDefault) || attribute.type !== old.type))
                    setAttribute = true;

                // curve types
                if (! setAttribute && attribute.type === 'curve') {
                    if (attribute.color || attribute.curves) {
                        var len = attribute.color ? attribute.color.length : attribute.curves.length;
                        if (! (value.keys[0] instanceof Array) || value.keys.length !== len)
                            setAttribute = true;
                    } else if (value.keys[0] instanceof Array) {
                        setAttribute = true;
                    }
                }
            } else {
                setAttribute = true;
            }

            if (setAttribute) {
                var history = entity.history.enabled;
                entity.history.enabled = false;
                entity.set('components.script.scripts.' + script + '.attributes.' + name, attributeValue(attribute));
                entity.history.enabled = history;
            }
        }));
        // unset attribute
        item.events.push(asset.on('*:unset', function(path, attribute) {
            if (! path.startsWith('data.scripts.' + script + '.attributes.'))
                return;

            var parts = path.split('.');
            if (parts.length !== 5)
                return;

            var name = parts[4];

            if (! entity.has('components.script.scripts.' + script + '.attributes.' + name))
                return;

            var history = entity.history.enabled;
            entity.history.enabled = false;
            entity.unset('components.script.scripts.' + script + '.attributes.' + name);
            entity.history.enabled = history;
        }));
    };


    editor.on('entities:add', function(entity) {
        var scripts = entity.get('components.script.order');
        if (scripts) {
            for(var i = 0; i < scripts.length; i++)
                indexAdd(entity, scripts[i]);
        }

        entity.on('components.script.order:insert', function(script) {
            indexAdd(this, script);
        });

        entity.on('components.script.order:remove', function(script) {
            indexRemove(this, script);
        });
    });

    editor.on('assets:scripts:primary:set', function(asset, script) {
        if (! index[script])
            return;

        for(var key in index[script]) {
            if (! index[script].hasOwnProperty(key))
                continue;

            updateAttributes(index[script][key].entity, script);
        }
    });

    editor.method('entities:list:byScript', function(script) {
        return index[script];
    });
});
