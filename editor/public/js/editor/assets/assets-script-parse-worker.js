onmessage = function(evt) {
    if (! evt.data.name)
        return;

    switch(evt.data.name) {
        case 'parse':
            parseScript(evt.data.asset, evt.data.url, evt.data.engine)
            break;
    }
};

var __results = {
    scriptsInvalid: [ ],
    scripts: { },
    loading: false
};

var window = self;

var parseScript = function(id, url, engine) {
    // import engine
    importScripts(engine);

    // loading screen override
    pc.script.createLoadingScreen = function() {
        __results.loading = true;
    };

    // implement pc.createScript
    pc.createScript = function(name, app, script) {
        var valid = true;

        if (script) {
            if (typeof script !== 'function') {
                if (!name) {
                    name = 'script';
                }
                valid = false;
                __results.scriptsInvalid.push('script class: \'' + name + '\' must be a constructor function (i.e. class).');
            } else if (!(script.prototype instanceof pc.ScriptType)) {
                if (!name) {
                    name = 'script';
                }
                valid = false;
                __results.scriptsInvalid.push('script class: \'' + name + '\' does not extend pc.ScriptType.');
            }
        }

        if (valid) {
            if (! name) {
                __results.scriptsInvalid.push('script name must be defined');
                valid = false;
                name = 'script';
            } else if (typeof(name) !== 'string') {
                __results.scriptsInvalid.push('script name must be a string');
                valid = false;
                name = 'script';
            } else if (name.indexOf('.') !== -1) {
                __results.scriptsInvalid.push('script name cannot contain dots');
                valid = false;
            } else if (__results.scripts[name]) {
                __results.scriptsInvalid.push('script `' + name + '` is defined more than once');
                valid = false;
            }
        }

        var obj = { };
        obj[name] = function() { };

        // name
        obj[name].name = name;

        function validateEnum(args) {
            if (!(args.enum instanceof Array)) {
                return 'must be an array';
            } else if (['boolean', 'string', 'number'].indexOf(args.type) === -1) {
                return 'can be used only with boolean, string or number';
            }

            const enumIndex = { };

            for (let i = 0; i < args.enum.length; i++) {
                if (typeof(args.enum[i]) !== 'object' || args.enum[i] instanceof Array) {
                    return 'option must be an object';
                } else if (Object.keys(args.enum[i]).length !== 1) {
                    return 'option must have one key';
                } else if (args.type === 'number' && typeof(parseInt(args.enum[i][Object.keys(args.enum[i])[0]], 10)) !== 'number') {
                    return 'option value must be a number';
                } else if (args.type === 'string' && typeof(args.enum[i][Object.keys(args.enum[i])[0]]) !== 'string') {
                    return 'option value must be a string';
                } else if (args.type === 'boolean' && typeof(args.enum[i][Object.keys(args.enum[i])[0]]) !== 'boolean') {
                    return 'option value must be a boolean';
                } else if (['rgb', 'rgba', 'vec2', 'vec3', 'vec4'].indexOf(args.type) !== -1 && ! (args.enum[i][Object.keys(args.enum[i])[0]] instanceof Array)) {
                    return 'option value must be an array';
                }

                const key = Object.keys(args.enum[i])[0];

                if (key.indexOf('.') !== -1) {
                    return `invalid enum name \`${key}\` - enum names cannot contain dots`;
                }

                if (enumIndex[key]) {
                    return `option \`${key}\` defined more than once`;
                }

                enumIndex[key] = true;
            }

            // parse enum to different format
            const obj = {
                order: [],
                options: {}
            };

            for (let i = 0; i < args.enum.length; i++) {
                const key = Object.keys(args.enum[i])[0];
                obj.order.push(key);
                obj.options[key] = args.enum[i][key];
            }
            args.enum = obj;
        }

        function validateDefaultValue(args) {
            if (args.array) {
                if (!(args.default instanceof Array)) {
                    return 'invalid default value - needs to be an array';
                }

                if (defaultValidators[args.type]) {
                    for (var i = 0; i < args.default.length; i++) {
                        const err = defaultValidators[args.type](args.default[i], args.schema);
                        if (err) {
                            return `invalid default value at index ${i} - ${err}`;
                        }
                    }
                }
            } else {
                if (defaultValidators[args.type]) {
                    const err = defaultValidators[args.type](args.default, args.schema);
                    if (err) {
                        return 'invalid default value - ' + err;
                    }
                }
            }
        }

        // attributes
        obj[name].attributes = {
            add: function(attr, args) {
                if (! valid)
                    return;

                var script = __results.scripts[name];

                if (! attr) {
                    script.attributesInvalid.push('attribute name must be defined');
                    return;
                } else if (typeof(attr) !== 'string') {
                    script.attributesInvalid.push('attribute name must be a string');
                    return;
                } else if (attr.indexOf('.') !== -1) {
                    script.attributesInvalid.push('attribute name cannot contain dots');
                    return;
                }

                if (script.attributes[attr]) {
                    script.attributesInvalid.push('attribute `' + attr + '` is defined more than once');
                    return;
                }

                if (! args) {
                    script.attributesInvalid.push('attribute `' + attr + '` args must be defined');
                    return;
                } else if (typeof(args) !== 'object') {
                    script.attributesInvalid.push('attribute `' + attr + '` args must be an object');
                    return;
                }

                if (! args.hasOwnProperty('type')) {
                    script.attributesInvalid.push('attribute `' + attr + '` args.type must be defined');
                    return;
                } else if (typeof(args.type) !== 'string') {
                    script.attributesInvalid.push('attribute `' + attr + '` args.type must be a string');
                    return;
                } else if (
                    [
                        'asset',
                        'boolean',
                        'curve',
                        'entity',
                        'number',
                        'rgb',
                        'rgba',
                        'string',
                        'vec2',
                        'vec3',
                        'vec4',
                        'json'
                    ].indexOf(args.type) === -1) {
                    script.attributesInvalid.push('attribute `' + attr + '` invalid type: ' + args.type);
                    return;
                }

                if (args.type !== 'json' && args.schema) {
                    script.attributesInvalid.push('attribute `' + attr + '` invalid field `schema` for type ' + args.type);
                    return;
                }

                if (args.type === 'json') {
                    // validate schema
                    if (!args.schema) {
                        script.attributesInvalid.push(`attribute \`${attr}\` missing schema`);
                        return;
                    }

                    if (!Array.isArray(args.schema) || !args.schema.length) {
                        script.attributesInvalid.push(`attribute \`${attr}\` schema must be a non-empty array`);
                        return;
                    }

                    var schemaFields = {};
                    for (let i = 0; i < args.schema.length; i++) {
                        const field = args.schema[i];
                        const name = field.name;
                        if (!name || typeof name !== 'string') {
                            script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: missing field name`);
                            return;
                        }

                        if (schemaFields[name]) {
                            script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: duplicate field name \`${name}\``);
                            return;
                        }

                        schemaFields[name] = true;

                        if (!/^\w+$/.test(name)) {
                            script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: field name \`${name}\` has invalid characters`);
                            return;
                        }

                        if (!field.hasOwnProperty('type')) {
                            script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: field type must be defined`);
                            return;
                        }

                        if (['asset',
                            'boolean',
                            'curve',
                            'entity',
                            'number',
                            'rgb',
                            'rgba',
                            'string',
                            'vec2',
                            'vec3',
                            'vec4'].indexOf(field.type) === -1) {
                            script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: field \`${name}\` has invalid type`);
                            return;
                        }

                        // validate enum
                        if (field.hasOwnProperty('enum')) {
                            const err = validateEnum(field);
                            if (err) {
                                script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: field \`${name}\` enum ${err}`);
                                return;
                            }
                        }

                        // validate default value
                        if (field.hasOwnProperty('default')) {
                            const err = validateDefaultValue(field);
                            if (err) {
                                script.attributesInvalid.push(`attribute \`${attr}\` invalid schema: field \`${name}\` ${err}`);
                                return;
                            }
                        }
                    }
                }

                if (args.hasOwnProperty('enum')) {
                    const err = validateEnum(args);
                    if (err) {
                        script.attributesInvalid.push(`attribute \`${attr}\` args.enum ${err}`);
                        return;
                    }
                }

                // validate default value
                if (args.hasOwnProperty('default')) {
                    const err = validateDefaultValue(args);
                    if (err) {
                        script.attributesInvalid.push(`attribute \`${attr}\`: ${err}`);
                        return;
                    }
                }

                script.attributesOrder.push(attr);
                script.attributes[attr] = args;
            }
        };

        if (script && script.attributes) {
            // override pc.ScriptType.attributes.add
            script.attributes.add = obj[name].attributes.add;
        }

        defaultValidators = {
            vec2: function (value) {
                if (! (value instanceof Array) || value.length !== 2) {
                    return 'needs to be an array of 2 numbers';
                }
                return null;
            },
            vec3: function (value) {
                if (! (value instanceof Array) || value.length !== 3) {
                    return 'needs to be an array of 3 numbers';
                }
                return null;
            },
            vec4: function (value) {
                if (! (value instanceof Array) || value.length !== 4) {
                    return 'needs to be an array of 4 numbers';
                }
                return null;
            },
            rgb: function (value) {
                if (! (value instanceof Array) || value.length !== 3) {
                    return 'needs to be an array of 3 numbers';
                }
                return null;
            },
            rgba: function (value) {
                if (! (value instanceof Array) || value.length !== 4) {
                    return 'needs to be an array of 4 numbers';
                }
                return null;
            },
            number: function (value) {
                if ( typeof value !== 'number') {
                    return 'needs to be a number';
                }
                return null;
            },
            boolean: function (value) {
                if (value !== true && value !== false) {
                    return 'needs to be a boolean';
                }
                return null;
            },
            string: function (value) {
                if (typeof value !== 'string') {
                    return 'needs to be a string';
                }
                return null;
            },
            json: function (value, schema) {
                if (typeof value !== 'object') {
                    return 'needs to be valid JSON';
                }

                const schemaIndex = {};
                for (let i = 0; i < schema.length; i++) {
                    schemaIndex[schema[i].name] = schema[i];

                    // make sure all fields in the schema are in the value
                    if (!value.hasOwnProperty(schema[i].name)) {
                        return 'missing field \`' + schema[i].name + '\` as defined in schema';
                    }
                }


                const keys = Object.keys(value);
                // do not allow fields not in the schema
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (!schemaIndex[key]) {
                        return 'field \`' + key + '\` not defined in schema';
                    }

                    const type = schemaIndex[key].type;
                    if (defaultValidators[type]) {
                        const err = defaultValidators[type](value[key]);
                        if (err) {
                            return 'field \`' + key + '\` ' + err;
                        }
                    }
                }

                return null;
            }
        };

        // extend
        obj[name].extend = function(methods) {
            for(var key in methods) {
                if (! methods.hasOwnProperty(key))
                    continue;

                obj[name].prototype[key] = methods[key];
            }
        };

        if (valid) {
            // define script in results
            __results.scripts[name] = {
                attributesInvalid: [ ],
                attributesOrder: [ ],
                attributes: { }
            };
        }

        return obj[name];
    };

    // implement pc.registerScript
    pc.registerScript = function (script, name, app) {
        if (typeof script === 'function' && script.prototype instanceof pc.ScriptType) {
            name = name || script.__name || pc.ScriptType.__getScriptName(script);
        }

        return pc.createScript(name, app, script);
    };

    // override ScriptAttributes#add to throw an error
    // which will happen if users try to call this method before calling
    // registerScript
    pc.ScriptAttributes.prototype.add = function (name) {
        __results.scriptsInvalid.push('script `' + this.scriptType.name + '` you have to call pc.registerScript or pc.createScript before declaring script attributes.');
    };

    // import script
    importScripts(url);

    // send results back
    postMessage({
        name: 'results',
        data: __results
    });

    close();
};
