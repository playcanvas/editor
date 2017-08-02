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
    pc.createScript = function(name) {
        var valid = true;

        if (! name) {
        __results.scriptsInvalid.push('script name must be defined');
            valid = false;
            name = 'script';
        } else if (typeof(name) !== 'string') {
        __results.scriptsInvalid.push('script name must be a string');
            valid = false;
            name = 'script';
        } else if (__results.scripts[name]) {
        __results.scriptsInvalid.push('script `' + name + '` is defined more than once');
            valid = false;
        }

        var obj = { };
        obj[name] = function() { };

        // name
        obj[name].name = name;

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
                }

                if (args.hasOwnProperty('enum')) {
                    if (! (args.enum instanceof Array)) {
                        script.attributesInvalid.push('attribute `' + attr + '` args.enum must be an array');
                        return;
                    } else if ([ 'boolean', 'string', 'number' ].indexOf(args.type) === -1) {
                        script.attributesInvalid.push('attribute `' + attr + '` args.enum can be used only with boolean, string or number');
                        return;
                    } else {
                        var emumIndex = { };

                        for(var i = 0; i < args.enum.length; i++) {
                            if (typeof(args.enum[i]) !== 'object' || args.enum[i] instanceof Array) {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option must be an object');
                                return;
                            } else if (Object.keys(args.enum[i]).length !== 1) {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option must have one key');
                                return;
                            } else if (args.type === 'number' && typeof(parseInt(args.enum[i][Object.keys(args.enum[i])[0]], 10)) !== 'number') {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option value must be a number');
                                return;
                            } else if (args.type === 'string' && typeof(args.enum[i][Object.keys(args.enum[i])[0]]) !== 'string') {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option value must be a string');
                                return;
                            } else if (args.type === 'boolean' && typeof(args.enum[i][Object.keys(args.enum[i])[0]]) !== 'boolean') {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option value must be a boolean');
                                return;
                            } else if ([ 'rgb', 'rgba', 'vec2', 'vec3', 'vec4' ].indexOf(args.type) !== -1 && ! (args.enum[i][Object.keys(args.enum[i])[0]] instanceof Array)) {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option value must be an array');
                                return;
                            }

                            var key = Object.keys(args.enum[i])[0];

                            if (key.indexOf('.') !== -1) {
                                script.attributesInvalid.push('attribute `' + attr + '`: invalid enum name `' + key + '` - enum names cannot contain dots');
                                return;
                            }

                            if (emumIndex[key]) {
                                script.attributesInvalid.push('attribute `' + attr + '` args.enum option `' + key + '` defined more than once');
                                return;
                            }
                        }
                    }

                    // parse enum to different format
                    var obj = {
                        order: [ ],
                        options: { }
                    };
                    for(var i = 0; i < args.enum.length; i++) {
                        var key = Object.keys(args.enum[i])[0];
                        obj.order.push(key);
                        obj.options[key] = args.enum[i][key];
                    }
                    args.enum = obj;
                }

                script.attributesOrder.push(attr);
                script.attributes[attr] = args;
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

    // import script
    importScripts(url);

    // send results back
    postMessage({
        name: 'results',
        data: __results
    });

    close();
};
