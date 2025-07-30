editor.once('load', () => {
    if (editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }


    // track all script assets
    // detect any collisions of script object within assets
    // notify about primary script asset
    // provide api to access assets by scripts and list available script objects

    const collisionScripts = {};
    const collisionStates = {};

    const assetToScripts = {};
    const scriptsList = [];
    const scripts = {};
    const scriptsPrimary = {};


    const primaryScriptSet = function (asset, script) {
        if (asset === null && scriptsPrimary[script]) {
            // unset
            asset = scriptsPrimary[script];
            delete scriptsPrimary[script];
            editor.emit('assets:scripts:primary:unset', asset, script);
            editor.emit(`assets[${asset.get('id')}]:scripts:primary:unset`, script);
            editor.emit(`assets:scripts[${script}]:primary:unset`, asset);
            editor.emit(`assets[${asset.get('id')}]:scripts[${script}]:primary:unset`);
        } else if (asset && asset.get('preload') && (!scriptsPrimary[script] || scriptsPrimary[script] !== asset)) {
            // set
            scriptsPrimary[script] = asset;
            editor.emit('assets:scripts:primary:set', asset, script);
            editor.emit(`assets[${asset.get('id')}]:scripts:primary:set`, script);
            editor.emit(`assets:scripts[${script}]:primary:set`, asset);
            editor.emit(`assets[${asset.get('id')}]:scripts[${script}]:primary:set`);
        }
    };

    const checkCollisions = function (asset, script) {
        const collides = [];

        if (collisionScripts[script]) {
            for (const key in collisionScripts[script]) {
                if (!collisionScripts[script].hasOwnProperty(key)) {
                    continue;
                }

                if (collisionScripts[script][key].get('preload')) {
                    collides.push(collisionScripts[script][key]);
                }
            }
        }

        if (collides.length > 1) {
            // collision occurs
            if (!collisionStates[script]) {
                collisionStates[script] = {};
            }

            for (let i = 0; i < collides.length; i++) {
                const key = collides[i].get('id');
                if (collisionStates[script][key]) {
                    continue;
                }

                collisionStates[script][key] = collides[i];
                editor.emit('assets:scripts:collide', collides[i], script);
                editor.emit(`assets[${key}]:scripts:collide`, script);
                editor.emit(`assets:scripts[${script}]:collide`, collides[i]);
                editor.emit(`assets[${key}]:scripts[${script}]:collide`);
            }

            primaryScriptSet(null, script);
        } else {
            // no collision
            if (collisionStates[script]) {
                for (const key in collisionStates[script]) {
                    if (!collisionStates[script].hasOwnProperty(key)) {
                        continue;
                    }

                    editor.emit('assets:scripts:resolve', collisionStates[script][key], script);
                    editor.emit(`assets[${key}]:scripts:resolve`, script);
                    editor.emit(`assets:scripts[${script}]:resolve`, collisionStates[script][key]);
                    editor.emit(`assets[${key}]:scripts[${script}]:resolve`);
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

    const addScript = function (asset, script) {
        const assetId = asset.get('id');

        if (!assetToScripts[assetId]) {
            assetToScripts[assetId] = {};
        }

        if (assetToScripts[assetId][script]) {
            // 1. check if already indexed, then update
            editor.emit('assets:scripts:change', asset, script);
            editor.emit(`assets:scripts[${script}]:change`, asset);
            // console.log('assets:scripts:change', asset.json(), script);
        } else {
            // 2. if not indexed, then add
            assetToScripts[assetId][script] = true;
            if (!scripts[script]) scripts[script] = {};
            scripts[script][assetId] = asset;

            editor.emit('assets:scripts:add', asset, script);
            editor.emit(`assets[${asset.get('id')}]:scripts:add`, script);
            // console.log('assets:scripts:add', asset.json(), script);
        }

        // 3. check for collisions
        if (scriptsList.indexOf(script) === -1) {
            scriptsList.push(script);

            primaryScriptSet(asset, script);
        } else {
            if (!collisionScripts[script]) {
                collisionScripts[script] = {};
            }

            if (!collisionScripts[script][assetId]) {
                for (const key in scripts[script]) {
                    if (!scripts[script].hasOwnProperty(key) || collisionScripts[script][key]) {
                        continue;
                    }

                    collisionScripts[script][key] = scripts[script][key];
                }

                checkCollisions(asset, script);
            }
        }
    };

    const removeScript = function (asset, script) {
        const assetId = asset.get('id');

        if (!assetToScripts[assetId] || !assetToScripts[assetId][script] || !scripts[script]) {
            return;
        }

        delete assetToScripts[assetId][script];
        if (Object.keys(assetToScripts[assetId]).length === 0) {
            delete assetToScripts[assetId];
        }

        checkCollisions(null, script);

        delete scripts[script][assetId];
        const scriptAssets = Object.keys(scripts[script]).length;
        if (scriptAssets === 0) {
            delete scripts[script];
            const ind = scriptsList.indexOf(script);
            scriptsList.splice(ind, 1);
        } else if (collisionScripts[script] && collisionScripts[script][assetId]) {
            delete collisionScripts[script][assetId];
            const collisions = collisionScripts[script];
            if (Object.keys(collisionScripts[script]).length === 1) {
                delete collisionScripts[script];
            }

            for (const key in collisions) {
                checkCollisions(collisions[key], script);
            }
        }

        editor.emit('assets:scripts:remove', asset, script);
        editor.emit(`assets[${assetId}]:scripts:remove`, script);
        editor.emit(`assets:scripts[${script}]:remove`, asset);
        editor.emit(`assets[${assetId}]:scripts[${script}]:remove`);
        // console.log('assets:scripts:remove', asset.json(), script);
    };

    editor.on('assets:add', (asset) => {
        if (asset.get('type') !== 'script') {
            return;
        }

        // index scripts
        const scripts = asset.get('data.scripts');
        for (const key in scripts) {
            if (!scripts.hasOwnProperty(key)) {
                continue;
            }

            addScript(asset, key);
        }

        // subscribe to changes
        asset.on('*:set', function (path, value, old) {
            if (path === 'preload') {
                const scripts = Object.keys(this.get('data.scripts'));
                for (let i = 0; i < scripts.length; i++) {
                    checkCollisions(this, scripts[i]);
                }

                return;
            }

            if (!path.startsWith('data.scripts.')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length < 3) return;

            const script = parts[2];

            if (parts.length === 3) {
                // data.scripts.*
                addScript(asset, script);
            } else if (parts.length === 5 && parts[3] === 'attributes') {
                // data.scripts.*.attributes.*
                const attr = parts[4];
                editor.emit('assets:scripts:attribute:change', asset, script, attr, value, old);
                editor.emit(`assets:scripts[${script}]:attribute:change`, asset, attr, value, old);
            }
        });

        asset.on('*:unset', (path, value) => {
            if (!path.startsWith('data.scripts.')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length < 3) return;

            const script = parts[2];

            // data.scripts.*
            if (parts.length === 3) {
                removeScript(asset, script);
            }
        });

        // add attribute
        asset.on('*:insert', (path, value, ind) => {
            if (!path.startsWith('data.scripts.')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length !== 4 || parts[3] !== 'attributesOrder') return;

            const script = parts[2];
            editor.emit('assets:scripts:attribute:set', asset, script, value, ind);
            editor.emit(`assets[${asset.get('id')}]:scripts:attribute:set`, script, value, ind);
            editor.emit(`assets:scripts[${script}]:attribute:set`, asset, value, ind);
            editor.emit(`assets[${asset.get('id')}]:scripts[${script}]:attribute:set`, value, ind);
        });

        // remove attribute
        asset.on('*:remove', (path, value) => {
            if (!path.startsWith('data.scripts.')) {
                return;
            }

            const parts = path.split('.');
            if (parts.length !== 4 || parts[3] !== 'attributesOrder') return;

            const script = parts[2];
            editor.emit('assets:scripts:attribute:unset', asset, script, value);
            editor.emit(`assets[${asset.get('id')}]:scripts:attribute:unset`, script, value);
            editor.emit(`assets:scripts[${script}]:attribute:unset`, asset, value);
            editor.emit(`assets[${asset.get('id')}]:scripts[${script}]:attribute:unset`, value);
        });

        asset.on('*:move', (path, value, ind, indOld) => {
            if (!path.startsWith('data.scripts.')) {
                return;
            }

            const parts = path.split('.');

            if (parts.length === 4 && parts[3] === 'attributesOrder') {
                const script = parts[2];

                editor.emit('assets:scripts:attribute:move', asset, script, value, ind, indOld);
                editor.emit(`assets[${asset.get('id')}]:scripts:attribute:move`, script, value, ind, indOld);
                editor.emit(`assets:scripts[${script}]:attribute:move`, asset, value, ind, indOld);
                editor.emit(`assets[${asset.get('id')}]:scripts[${script}]:attribute:move`, value, ind, indOld);
            }
        });

        asset.once('destroy', () => {
            const scripts = asset.get('data.scripts');
            for (const key in scripts) {
                if (!scripts.hasOwnProperty(key)) {
                    continue;
                }

                removeScript(asset, key);
            }
        });
    });

    editor.method('assets:scripts:list', () => {
        return scriptsList.slice(0);
    });

    editor.method('assets:scripts:assetByScript', (script) => {
        return scriptsPrimary[script] || null;
    });

    editor.method('assets:scripts:collide', (script) => {
        return collisionStates[script];
    });

    editor.method('assets:scripts:collideList', () => {
        return Object.keys(collisionStates);
    });
});
