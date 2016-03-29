editor.once('load', function() {
    'use strict';

    var scriptBoilerplate = "var {className} = new pc.Script('{scriptName}');\n\n{className}.prototype.initialize = function() {\n    // initialize code called once per entity\n};\n\n{className}.prototype.update = function(dt) {\n    // update code called every frame\n};\n";
    var filenameValid = /^([^0-9.#<>$+%!`&='{}@\\/:*?"<>|\n])([^#<>$+%!`&='{}@\\/:*?"<>|\n])*$/i;


    editor.method('assets:create:script', function (args) {
        if (! editor.call('permissions:write'))
            return;

        args = args || { };

        var filename = args.filename || 'script.js';

        if (args.boilerplate) {
            var name = filename.slice(0, -3);
            var className = args.className || '';
            var scriptName = args.scriptName || name;

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
                    if (! scriptName)
                        scriptName = tokens.join('-');

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
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
