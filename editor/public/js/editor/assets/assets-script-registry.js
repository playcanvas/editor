editor.once('load', function() {
    'use strict';

    if (editor.call('project:settings').get('use_legacy_scripts'))
        return;


    // track all script assets
    // detect any collisions of script object within assets
    // notify about primary script asset
    // provide api to access assets by scripts and list available script objects


    var collisionAssets = { };
    var collisionScripts = { };
    var collisionStates = { };

    var assetToScripts = { };
    var scriptsList = [ ];
    var scripts = { };
    var scriptsPrimary = { };


    var addScript = function(asset, script) {
        var assetId = asset.get('id');

        if (! assetToScripts[assetId])
            assetToScripts[assetId] = { };

        if (assetToScripts[assetId][script]) {
            // 1. check if already indexed, then update
            editor.emit('assets:scripts:change', asset, script);
            editor.emit('assets:scripts[' + script + ']:change', asset);
            // console.log('assets:scripts:change', asset.json(), script);
        } else {
            // 2. if not indexed, then add
            assetToScripts[assetId][script] = true;
            if (! scripts[script]) scripts[script] = { };
            scripts[script][assetId] = asset;

            editor.emit('assets:scripts:add', asset, script);
            editor.emit('assets[' + asset.get('id') + ']:scripts:add', script);
            // console.log('assets:scripts:add', asset.json(), script);
        }

        // 3. check for collisions
        if (scriptsList.indexOf(script) === -1) {
            scriptsList.push(script);

            primaryScriptSet(asset, script);
        } else {
            if (! collisionScripts[script])
                collisionScripts[script] = { };

            if (! collisionScripts[script][assetId]) {
                for(var key in scripts[script]) {
                    if (! scripts[script].hasOwnProperty(key) || collisionScripts[script][key])
                        continue;

                    collisionScripts[script][key] = scripts[script][key];
                }

                checkCollisions(asset, script);
            }
        }
    };

    var removeScript = function(asset, script) {
        var assetId = asset.get('id');

        if (! assetToScripts[assetId] || ! assetToScripts[assetId][script] || ! scripts[script])
            return;

        delete assetToScripts[assetId][script];
        if (Object.keys(assetToScripts[assetId]).length === 0)
            delete assetToScripts[assetId];

        checkCollisions(null, script);

        delete scripts[script][assetId];
        var scriptAssets = Object.keys(scripts[script]).length;
        if (scriptAssets === 0) {
            delete scripts[script];
            var ind = scriptsList.indexOf(script);
            scriptsList.splice(ind, 1);
        } else if (collisionScripts[script] && collisionScripts[script][assetId]) {
            delete collisionScripts[script][assetId];
            var collisions = collisionScripts[script];
            if (Object.keys(collisionScripts[script]).length === 1)
                delete collisionScripts[script];

            for(var key in collisions)
                checkCollisions(collisions[key], script);
        }

        editor.emit('assets:scripts:remove', asset, script);
        editor.emit('assets[' + assetId + ']:scripts:remove', script);
        editor.emit('assets:scripts[' + script + ']:remove', asset);
        editor.emit('assets[' + assetId + ']:scripts[' + script + ']:remove');
        // console.log('assets:scripts:remove', asset.json(), script);
    };

    var checkCollisions = function(asset, script) {
        var collides = [ ];

        if (collisionScripts[script]) {
            for(var key in collisionScripts[script]) {
                if (! collisionScripts[script].hasOwnProperty(key))
                    continue;

                if (collisionScripts[script][key].get('preload'))
                    collides.push(collisionScripts[script][key]);
            }
        }

        if (collides.length > 1) {
            // collision occurs
            if (! collisionStates[script])
                collisionStates[script] = { };

            for(var i = 0; i < collides.length; i++) {
                var key = collides[i].get('id');
                if (collisionStates[script][key])
                    continue;

                collisionStates[script][key] = collides[i];
                editor.emit('assets:scripts:collide', collides[i], script);
                editor.emit('assets[' + key + ']:scripts:collide', script);
                editor.emit('assets:scripts[' + script + ']:collide', collides[i]);
                editor.emit('assets[' + key + ']:scripts[' + script + ']:collide');
            }

            primaryScriptSet(null, script);
        } else {
            // no collision
            if (collisionStates[script]) {
                for(var key in collisionStates[script]) {
                    if (! collisionStates[script].hasOwnProperty(key))
                        continue;

                    editor.emit('assets:scripts:resolve', collisionStates[script][key], script);
                    editor.emit('assets[' + key + ']:scripts:resolve', script);
                    editor.emit('assets:scripts[' + script + ']:resolve', collisionStates[script][key]);
                    editor.emit('assets[' + key + ']:scripts[' + script + ']:resolve');
                }

                delete collisionStates[script];
            }

            if (collides.length === 1) {
                primaryScriptSet(collides[0], script);
            } else if (asset && asset.get('preload')) {
                primaryScriptSet(asset, script);
            } else {
                primaryScriptSet(null, script);
            }
        }
    };

    var primaryScriptSet = function(asset, script) {
        if (asset === null && scriptsPrimary[script]) {
            // unset
            asset = scriptsPrimary[script];
            delete scriptsPrimary[script];
            editor.emit('assets:scripts:primary:unset', asset, script);
            editor.emit('assets[' + asset.get('id') + ']:scripts:primary:unset', script);
            editor.emit('assets:scripts[' + script + ']:primary:unset', asset);
            editor.emit('assets[' + asset.get('id') + ']:scripts[' + script + ']:primary:unset');
        } else if (asset && asset.get('preload') && (! scriptsPrimary[script] || scriptsPrimary[script] !== asset)) {
            // set
            scriptsPrimary[script] = asset;
            editor.emit('assets:scripts:primary:set', asset, script);
            editor.emit('assets[' + asset.get('id') + ']:scripts:primary:set', script);
            editor.emit('assets:scripts[' + script + ']:primary:set', asset);
            editor.emit('assets[' + asset.get('id') + ']:scripts[' + script + ']:primary:set');
        }
    };

    editor.on('assets:add', function(asset) {
        if (asset.get('type') !== 'script')
            return;

        var assetId = asset.get('id');

        // index scripts
        var scripts = asset.get('data.scripts');
        for(var key in scripts) {
            if (! scripts.hasOwnProperty(key))
                continue;

            addScript(asset, key);
        }

        // subscribe to changes
        asset.on('*:set', function(path, value, old) {
            if (path === 'preload') {
                var scripts = Object.keys(this.get('data.scripts'));
                for(var i = 0; i < scripts.length; i++)
                    checkCollisions(this, scripts[i]);

                return;
            }

            if (! path.startsWith('data.scripts.'))
                return;

            var parts = path.split('.');
            if (parts.length < 3) return;

            var script = parts[2];

            if (parts.length === 3) {
                // data.scripts.*
                addScript(asset, script);
            } else if (parts.length === 5 && parts[3] === 'attributes') {
                // data.scripts.*.attributes.*
                var attr = parts[4];
                editor.emit('assets:scripts:attribute:change', asset, script, attr, value, old);
                editor.emit('assets:scripts[' + script + ']:attribute:change', asset, attr, value, old);
            }
        });

        asset.on('*:unset', function(path, value) {
            if (! path.startsWith('data.scripts.'))
                return;

            var parts = path.split('.');
            if (parts.length < 3) return;

            var script = parts[2];

            if (parts.length === 3) // data.scripts.*
                removeScript(asset, script);
        });

        // add attribute
        asset.on('*:insert', function(path, value, ind) {
            if (! path.startsWith('data.scripts.'))
                return;

            var parts = path.split('.');
            if (parts.length !== 4 || parts[3] !== 'attributesOrder') return;

            var script = parts[2];
            editor.emit('assets:scripts:attribute:set', asset, script, value, ind);
            editor.emit('assets[' + asset.get('id') + ']:scripts:attribute:set', script, value, ind);
            editor.emit('assets:scripts[' + script + ']:attribute:set', asset, value, ind);
            editor.emit('assets[' + asset.get('id') + ']:scripts[' + script + ']:attribute:set', value, ind);
        });

        // remove attribute
        asset.on('*:remove', function(path, value) {
            if (! path.startsWith('data.scripts.'))
                return;

            var parts = path.split('.');
            if (parts.length !== 4 || parts[3] !== 'attributesOrder') return;

            var script = parts[2];
            editor.emit('assets:scripts:attribute:unset', asset, script, value);
            editor.emit('assets[' + asset.get('id') + ']:scripts:attribute:unset', script, value);
            editor.emit('assets:scripts[' + script + ']:attribute:unset', asset, value);
            editor.emit('assets[' + asset.get('id') + ']:scripts[' + script + ']:attribute:unset', value);
        });

        asset.on('*:move', function(path, value, ind, indOld) {
            if (! path.startsWith('data.scripts.'))
                return;

            var parts = path.split('.');

            if (parts.length === 4 && parts[3] === 'attributesOrder') {
                var script = parts[2];

                editor.emit('assets:scripts:attribute:move', asset, script, value, ind, indOld);
                editor.emit('assets[' + asset.get('id') + ']:scripts:attribute:move', script, value, ind, indOld);
                editor.emit('assets:scripts[' + script + ']:attribute:move', asset, value, ind, indOld);
                editor.emit('assets[' + asset.get('id') + ']:scripts[' + script + ']:attribute:move', value, ind, indOld);
            }
        });

        asset.once('destroy', function() {
            var scripts = asset.get('data.scripts');
            for(var key in scripts) {
                if (! scripts.hasOwnProperty(key))
                    continue;

                removeScript(asset, key);
            }
        });
    });

    editor.method('assets:scripts:list', function() {
        return scriptsList.slice(0);
    });

    editor.method('assets:scripts:assetByScript', function(script) {
        return scriptsPrimary[script] || null;
    });

    editor.method('assets:scripts:collide', function(script) {
        return collisionStates[script];
    });
});
