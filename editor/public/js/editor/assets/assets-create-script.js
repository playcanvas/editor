editor.once('load', function() {
    'use strict';

    var scriptBoilerplate = "var {className} = pc.CreateScript('{scriptName}');\n\n// initialize code called once per entity\n{className}.prototype.initialize = function() {\n    \n};\n\n// update code called every frame\n{className}.prototype.update = function(dt) {\n    \n};\n\n// swap method called for script hot-reloading\n// inherit your script state here\n{className}.prototype.swap = function(old) {\n    \n};\n\n// to learn more about script anatomy, please read:\n// http://developer.playcanvas.com/en/";
    var filenameValid = /^([^0-9.#<>$+%!`&='{}@\\/:*?"<>|\n])([^#<>$+%!`&='{}@\\/:*?"<>|\n])*$/i;


    editor.method('assets:create:script', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var filename = args.filename || 'script.js';

        if (args.boilerplate) {
            var name = filename.slice(0, -3);
            var className = args.className || '';
            var scriptName = args.scriptName || '';

            if (! className || ! scriptName) {
                // tokenize filename
                var tokens = [ ];
                var string = name.replace(/([^A-Z])([A-Z][^A-Z])/g, '$1 $2').replace(/([A-Z0-9]{2,})/g, ' $1');
                var parts = string.split(/(\s|\-|_|\.)/g);

                // filter valid tokens
                for(var i = 0; i < parts.length; i++) {
                    parts[i] = parts[i].toLowerCase().trim();
                    if (parts[i] && parts[i] !== '-' && parts[i] !== '_' && parts[i] !== '.')
                        tokens.push(parts[i]);
                }

                if (tokens.length) {
                    if (! scriptName) {
                        scriptName = tokens[0];

                        for(var i = 1; i < tokens.length; i++) {
                            scriptName += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
                        }
                    }

                    if (! className) {
                        for(var i = 0; i < tokens.length; i++) {
                            className += tokens[i].charAt(0).toUpperCase() + tokens[i].slice(1);
                        }
                    }
                } else {
                    if (! className)
                        className = 'Script';

                    if (! scriptName)
                        scriptName = 'script';
                }
            }

            if (! filenameValid.test(className))
                className = 'Script';

            args.content = scriptBoilerplate.replace(/\{className\}/g, className).replace(/\{scriptName\}/g, scriptName);
        }

        var asset = {
            name: filename,
            type: 'script',
            source: false,
            preload: true,
            parent: (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder'),
            filename: filename,
            file: new Blob([ args.content || '' ], { type: 'text/javascript' }),
            data: {
                scripts: { },
                loading: false
            },
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset, function(err, assetId) {
            if (err) return;

            var asset = editor.call('assets:get', assetId);
            if (! asset) return;

            // parse once file is available
            asset.once('file.url:set', function() {
                // artificial delay to avoid racing condition
                // of file not getting uploaded to s3 in time
                setTimeout(function() {
                    editor.call('scripts:parse', asset, function(err, result) {
                        if (args.callback)
                            args.callback(err, result);
                    });
                }, 500);
            });
        }, args.noSelect);
    });
});
