import { ObserverSync } from '../../common/observer-sync.ts';

editor.once('load', () => {
    const legacyScripts = editor.call('settings:project').get('useLegacyScripts');
    const syncPaths = [
        'name',
        'exclude',
        'preload',
        'tags',
        'scope',
        'data',
        'meta',
        'file',
        'i18n'
    ];

    // try to detect if the browser was inactive for a while e.g.
    // if the computer went to sleep
    const IDLE_CHECK_DELAY = 2000;
    const IDLE_CHECK_SAFE_WINDOW = 10000;

    let lastIdleCheck = Date.now();
    let wasIdle = false;
    let timeoutLoad = null;
    setInterval(() => {
        const t = Date.now();
        const dt = t - lastIdleCheck;
        if (dt > IDLE_CHECK_DELAY + IDLE_CHECK_SAFE_WINDOW) {
            wasIdle = true;
            console.log(`Browser was idle for about ${dt / 1000} seconds...`);
        }
        lastIdleCheck = t;
    }, IDLE_CHECK_DELAY);

    editor.method('assets:fs:paths:patch', (data) => {
        const connection = editor.call('realtime:connection');
        const assets = connection.collections.assets;

        for (let i = 0; i < data.length; i++) {
            if (!assets.hasOwnProperty(data[i].uniqueId)) {
                continue;
            }

            // force snapshot path data
            assets[data[i].uniqueId].data.path = data[i].path;

            // sync observer
            editor.emit('realtime:op:assets', {
                p: ['path'],
                oi: data[i].path,
                od: null
            }, data[i].uniqueId);
        }
    });

    // load all assets
    editor.on('realtime:authenticated', () => {
        editor.call('assets:clear');

        if (timeoutLoad) {
            clearTimeout(timeoutLoad);
            timeoutLoad = null;
        }

        function loadAll() {
            editor.api.globals.assets.loadAllAndSubscribe();
        }

        if (wasIdle) {
            wasIdle = false;
            // if browser was idle wait for a few
            // seconds before trying to load the assets
            // because the request seems to expire in that case
            editor.call('status:job', 'asset:load', 1);
            timeoutLoad = setTimeout(() => {
                timeoutLoad = null;
                editor.call('status:job', 'asset:load');
                loadAll();
            }, 5000);
        } else {
            loadAll();
        }
    });

    editor.call('assets:progress', 0.1);

    const onAssetSelect = function (asset) {
        editor.api.globals.selection.set([asset.apiAsset]);

        // navigate to folder too
        const path = asset.get('path');
        if (path.length) {
            editor.call('assets:panel:currentFolder', editor.call('assets:get', path[path.length - 1]));
        } else {
            editor.call('assets:panel:currentFolder', null);
        }
    };

    // create asset
    editor.method('assets:create', (data, fn, noSelect) => {
        let evtAssetAdd;

        if (!noSelect) {
            editor.once('selector:change', () => {
                if (evtAssetAdd) {
                    evtAssetAdd.unbind();
                    evtAssetAdd = null;
                }
            });
        }

        editor.call('assets:uploadFile', data, (err, res) => {
            if (err) {
                editor.call('status:error', err);

                // TODO
                // disk allowance error

                if (fn) fn(err);

                return;
            }

            if (!noSelect) {
                const asset = editor.call('assets:get', res.id);
                if (asset) {
                    onAssetSelect(asset);
                } else {
                    evtAssetAdd = editor.once(`assets:add[${res.id}]`, onAssetSelect);
                }
            }

            if (fn) fn(err, res.id);
        });
    });

    // delete asset
    editor.method('assets:delete', (list) => {
        if (!(list instanceof Array)) {
            list = [list];
        }

        const assets = [];

        for (let i = 0; i < list.length; i++) {
            if (legacyScripts && list[i].get('type') === 'script') {
                editor.emit('sourcefiles:remove', list[i]);
                editor.api.globals.rest.projects.projectRepoSourcefilesDelete(list[i].get('filename'));
            } else {
                assets.push(list[i]);
            }
        }

        if (assets.length) {
            editor.call('assets:fs:delete', assets);
        }
    });

    editor.on('assets:add', (asset) => {
        if (asset.sync) {
            return;
        }

        asset.sync = new ObserverSync({
            item: asset,
            paths: syncPaths
        });

        // client > server
        asset.sync.on('op', (op) => {
            editor.call('realtime:assets:op', op, asset.get('uniqueId'));
        });

    });

    // write asset operations
    editor.method('realtime:assets:op', (op, uniqueId) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const asset = editor.api.globals.realtime.assets.get(uniqueId);
        if (!asset) return;

        asset.submitOp(op);
    });

    // server > client
    editor.on('realtime:op:assets', (op, uniqueId) => {
        const asset = editor.call('assets:getUnique', uniqueId);
        if (asset) {
            // console.log('in: ' + id + ' [ ' + Object.keys(op).filter(function(i) { return i !== 'p' }).join(', ') + ' ]', op.p.join('.'));
            // console.log(op);
            asset.sync.write(op);
        } else {
            log.error(`realtime operation on missing asset: ${op.p[1]}`);
        }
    });

    // handle disconnection
    editor.on('realtime:disconnected', () => {
        const app = editor.call('viewport:app');
        if (app) {
            // clear ALL asset registry events
            // TODO: This will mean that after re-connection some events
            // that were registered on the asset registry will not be re-registered.
            // That might break some stuff. E.g. currently translations in the Editor
            // will not re-appear after re-connection because they rely on the asset registry's
            // 'add' event which gets removed.
            if (app.assets._callbacks instanceof Map) {
                // from the engine 1.65 onwards the callbacks are stored in a Map
                app.assets._callbacks.clear();
            } else {
                // compatibility with 1.64 and below
                app.assets._callbacks = { };
            }
        }

        editor.call('assets:clear');
    });
});
