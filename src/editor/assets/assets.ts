import type { Asset, AssetObserver } from '@playcanvas/editor-api';

// NAMESPACE
//     asset
//
// METHODS
//     add
//     remove
//     get
//     find
//     findOne
//
// EVENTS
//     add
//     remove

editor.once('load', () => {
    // hook into private assets observer list in API
    // (this should all be temporary as this file should eventually be removed)
    const assets = editor.api.globals.assets.raw;

    editor.api.globals.assets.on('add', (asset: Asset, pos: number) => {
        editor.emit(`assets:add[${asset.get('id')}]`, asset.observer, pos);
        editor.emit('assets:add', asset.observer, pos);
    });

    editor.api.globals.assets.on('remove', (asset: Asset) => {
        editor.emit('assets:remove', asset.observer);
        editor.emit(`assets:remove[${asset.get('id')}]`);
    });

    editor.api.globals.assets.on('clear', () => {
        editor.emit('assets:clear');
    });

    editor.api.globals.assets.on('move', (asset: Asset, pos: number) => {
        editor.emit('assets:move', asset, pos);
    });

    editor.api.globals.assets.on('load:progress', (progress) => {
        editor.call('assets:progress', progress);
    });

    editor.api.globals.assets.on('load:all', () => {
        editor.emit('assets:load');
    });

    // return assets ObserverList
    editor.method('assets:raw', () => {
        return assets;
    });

    // allow adding assets
    editor.method('assets:add', (asset: AssetObserver) => {
        editor.api.globals.assets.add(asset.apiAsset);
    });

    // allow removing assets
    editor.method('assets:remove', (asset: AssetObserver) => {
        editor.api.globals.assets.remove(asset.apiAsset);
    });

    // remove all assets
    editor.method('assets:clear', () => {
        editor.api.globals.assets.clear();
    });

    // get asset by id
    editor.method('assets:get', (id) => {
        const asset = editor.api.globals.assets.get(id);
        return asset ? asset.observer : null;
    });

    // get asset by unique id
    editor.method('assets:getUnique', (uniqueId) => {
        const asset = editor.api.globals.assets.getUnique(uniqueId);
        return asset ? asset.observer : null;
    });

    // find assets by function
    editor.method('assets:find', (fn) => {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', (fn) => {
        return assets.findOne(fn);
    });

    editor.method('assets:map', (fn) => {
        assets.map(fn);
    });

    editor.method('assets:list', () => {
        return assets.array();
    });

    editor.method('assets:isScript', (asset) => {
        return asset.get('type') === 'script';
    });

    editor.method('assets:isModule', (asset) => {
        return editor.call('assets:isScript', asset) &&
            asset.get('file.filename')?.endsWith('.mjs');
    });

    editor.method('assets:virtualPath', (asset) => {
        const filename = asset.get('file').filename;
        if (!filename) {
            return null;
        }
        const path = asset.get('path') || [];
        const pathSegments: string[] = path.reduce((segments, id) => {
            const asset = editor.call('assets:get', id);
            if (asset) {
                segments.push(asset.get('name'));
            }
            return segments;
        }, []);
        return `/${[...pathSegments, filename].join('/')}`;
    });

    editor.method('assets:realPath', (asset) => {
        return `/api/assets/${asset.get('id')}/file/${asset.get('name')}?branchId=${config.self.branch.id}`;
    });

    // get asset ide path
    editor.method('assets:idePath', (ide: 'cursor' | 'vscode', asset) => {
        return `${ide}://playcanvas.playcanvas/project/${config.project.id}/asset/${asset.get('id')}`;
    });
});
