editor.once('load', function() {
    'use strict';

    if (editor.call('project:settings').get('use_legacy_scripts'))
        return;

    var collisionAssets = { };
    var collisionScripts = { };

    var assetToScripts = { };
    var scriptsList = [ ];
    var scripts = { };


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
        } else {
            if (! collisionScripts[script])
                collisionScripts[script] = { };

            if (! collisionScripts[script][assetId]) {
                for(var key in scripts[script]) {
                    if (! scripts[script].hasOwnProperty(key) || collisionScripts[script][key])
                        continue;

                    collisionScripts[script][key] = scripts[script][key];
                    editor.emit('assets:scripts:collide', scripts[script][key], script);
                    editor.emit('assets[' + scripts[script][key].get('id') + ']:scripts:collide', script);
                    editor.emit('assets:scripts[' + script + ']:collide', scripts[script][key]);
                    editor.emit('assets[' + scripts[script][key].get('id') + ']:scripts[' + script + ']:collide');
                    // console.log('assets:scripts:collide', scripts[script][key].json(), script);
                }
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

        delete scripts[script][assetId];
        var scriptAssets = Object.keys(scripts[script]).length;
        if (scriptAssets === 0) {
            delete scripts[script];
            var ind = scriptsList.indexOf(script);
            scriptsList.splice(ind, 1);
        } else if (scriptAssets === 1 && collisionScripts[script]) {
            // no more collision
            // TODO scripts2
            // check collision with not enabled scripts
            var collisions = collisionScripts[script];
            delete collisionScripts[script];

            for(var key in collisions) {
                if (! collisions.hasOwnProperty(key))
                    continue;

                editor.emit('assets:scripts:resolve', collisions[key], script);
                editor.emit('assets[' + collisions[key].get('id') + ']:scripts:resolve', script);
                editor.emit('assets:scripts[' + script + ']:resolve', collisions[key]);
                editor.emit('assets[' + collisions[key].get('id') + ']:scripts[' + script + ']:resolve');
                // console.log('assets:scripts:resolve', collisions[key].json(), script);
            }
        }

        editor.emit('assets:scripts:remove', asset, script);
        editor.emit('assets[' + assetId + ']:scripts:remove', script);
        editor.emit('assets:scripts[' + script + ']:remove', asset);
        editor.emit('assets[' + assetId + ']:scripts[' + script + ']:remove');
        // console.log('assets:scripts:remove', asset.json(), script);
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
        asset.on('*:set', function(path) {
            if (! path.startsWith('data.scripts'))
                return;

            var parts = path.split('.');
            if (parts.length < 3) return;

            var script = parts[2];

            if (parts.length === 3) {
                // data.scripts.*
                addScript(asset, script);
            } else if (parts.length >= 5 && parts[3] === 'attributes') {
                // data.scripts.*.attributes*
                editor.emit('assets:scripts:attribute:set', asset, script, parts[4]);
                editor.emit('assets:scripts[' + script + ']:attribute:set', asset, parts[4]);
                // console.log('assets:scripts:attribute:set', asset.json(), script, parts[4]);
            } else if (parts.length >= 4 && parts[3] === 'attributesOrder') {
                // TODO scripts2
                // ordering of attributes
            }
        });

        asset.on('*:unset', function(path) {
            if (! path.startsWith('data.scripts'))
                return;

            var parts = path.split('.');
            if (parts.length < 3) return;

            var script = parts[2];

            // TODO scripts2

            if (parts.length === 3) {
                // data.scripts.*
                removeScript(asset, script);
                // 1. check if indexed, then remove
                // 2. check if any collisions been resolved that way
            } else if (parts.length === 5 && parts[3] === 'attributes') {
                // data.scripts.*.attributes.*
                // 1. update attributes
                editor.emit('assets:scripts:attribute:unset', asset, script, parts[4]);
                editor.emit('assets:scripts[' + script + ']:attribute:unset', asset, parts[4]);
                // console.log('assets:scripts:attribute:unset', asset.json(), script, parts[4]);
            } else if (parts.length >= 6 && parts[3] === 'attributes') {
                // data.scripts.*.attributes.*.**
                // 1. update specific attribute
                // TODO scripts2
            }
        });

        // TODO scripts2
        // move, add, remove of attributesOrder

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
        // TODO scripts2
        // return list with points to files script is taken from
        return scriptsList.slice(0);
    });

    editor.method('assets:scripts:assetByScript', function(script) {
        // TODO scripts2
        // if multiple assets, try find relevant
        // if collision, add note

        for(var key in scripts[script]) {
            if (! scripts[script].hasOwnProperty(key))
                continue;

            return scripts[script][key];
        }

        return null;
    });

    editor.method('assets:scripts:collide', function(script) {
        return collisionScripts[script];
    });
});
