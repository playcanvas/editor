onmessage = function(evt) {
    if (! evt.data.name)
        return;

    switch(evt.data.name) {
        case 'parse':
            parseScript(evt.data.asset, evt.data.url)
            break;
    }
};

var __results = {
    scriptsInvalid: [ ],
    scripts: { }
};

var window = self;

var parseScript = function(id, url) {
    // import engine
    importScripts('/local/engine/build/output/playcanvas-latest.js');

    // implement pc.Script
    pc.Script = function(name) {
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
