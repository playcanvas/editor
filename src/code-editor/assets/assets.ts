import type { Observer } from '@playcanvas/observer';
import { ObserverList } from '@playcanvas/observer';

editor.once('load', () => {
    const uniqueIdToItemId = {};
    const assetToVirtualPath = new Map();
    const virtualPathToAsset = new Map();

    const assets = new ObserverList({
        index: 'id',
        sorted: function (a, b) {
            const f = (b._data.type === 'folder') - (a._data.type === 'folder');

            if (f !== 0) {
                return f;
            }

            if (a._data.name.toLowerCase() > b._data.name.toLowerCase()) {
                return 1;
            }
            if (a._data.name.toLowerCase() < b._data.name.toLowerCase()) {
                return -1;
            }
            return 0;
        }
    });

    function createLatestFn(id: string) {
        // function to get latest version of asset observer
        return function () {
            return assets.get(id);
        };
    }

    // return assets ObserverList
    editor.method('assets:raw', () => {
        return assets;
    });

    const updateAssetVirtualPath = (asset: Observer) => {
        const virtualPath = assetVirtualPath(asset);
        assetToVirtualPath.set(virtualPath, asset);
        virtualPathToAsset.set(asset, virtualPath);
    };

    editor.on('assets:load', () => {
        // store virtual path
        editor.call('assets:list')
        .filter(asset => editor.call('assets:isModule', asset))
        .forEach((asset) => {
            asset.on('file:set', () => {
                const path = virtualPathToAsset.get(asset);
                assetToVirtualPath.delete(path);
                virtualPathToAsset.delete(asset);
                updateAssetVirtualPath(asset);

                // After changing the file, update the dependencies of the focused tab
                const tab = editor.call('tabs:focused');
                if (tab) {
                    editor.call('asset:update-dependencies', tab.asset);
                }
            });
            updateAssetVirtualPath(asset);
        });
    });

    // allow adding assets
    editor.method('assets:add', (asset: Observer) => {
        uniqueIdToItemId[asset.get('uniqueId')] = asset.get('id');

        // function to get latest version of asset observer
        asset.latestFn = createLatestFn(asset.get('id'));

        const pos = assets.add(asset);

        if (pos === null) {
            return;
        }

        asset.on('name:set', function (name, nameOld) {
            name = name.toLowerCase();
            nameOld = nameOld.toLowerCase();

            const ind = assets.data.indexOf(this);
            let pos = assets.positionNextClosest(this, (a, b) => {
                const f = (b._data.type === 'folder') - (a._data.type === 'folder');

                if (f !== 0) {
                    return f;
                }

                if ((a === b ? nameOld : a._data.name.toLowerCase()) > name) {
                    return 1;
                }
                if ((a === b ? nameOld : a._data.name.toLowerCase()) < name) {
                    return -1;
                }
                return 0;
            });

            if (pos === -1 && (ind + 1) === assets.data.length) {
                return;
            }

            if (ind !== -1 && (ind + 1 === pos) || (ind === pos)) {
                return;
            }

            if (ind < pos) {
                pos--;
            }

            assets.move(this, pos);
            editor.emit('assets:move', asset, pos);
        });

        // publish added asset
        editor.emit(`assets:add[${asset.get('id')}]`, asset, pos);
        editor.emit('assets:add', asset, pos);
    });

    // allow removing assets
    editor.method('assets:remove', (asset: Observer) => {
        assets.remove(asset);
    });

    // remove all assets
    editor.method('assets:clear', () => {
        assets.clear();
        editor.emit('assets:clear');
    });

    // get asset by id
    editor.method('assets:get', (id: string) => {
        return assets.get(id);
    });

    // get asset by unique id
    editor.method('assets:getUnique', (uniqueId: string) => {
        const id = uniqueIdToItemId[uniqueId];
        return id ? assets.get(id) : null;
    });

    // find assets by function
    editor.method('assets:find', (fn: (asset: Observer) => boolean) => {
        return assets.find(fn);
    });

    // find one asset by function
    editor.method('assets:findOne', (fn: (asset: Observer) => boolean) => {
        return assets.findOne(fn);
    });

    editor.method('assets:map', (fn: (asset: Observer) => unknown) => {
        assets.map(fn);
    });

    editor.method('assets:list', () => {
        return assets.array();
    });

    // publish remove asset
    assets.on('remove', (asset: Observer) => {
        asset.destroy();
        editor.emit('assets:remove', asset);
        delete uniqueIdToItemId[asset.get('uniqueId')];
    });

    editor.method('assets:isScript', (asset: Observer) => {
        return asset.get('type') === 'script';
    });

    editor.method('assets:isModule', (asset: Observer) => {
        return editor.call('assets:isScript', asset) &&
            asset.get('file.filename')?.endsWith('.mjs');
    });

    const assetVirtualPath = (asset: Observer) => {
        if (!asset.get('file')?.filename) {
            return null;
        }
        const assetPath = asset.get('path');
        const pathAssets = assetPath.map(id => editor.call('assets:get', id));
        if (pathAssets.some(a => !a)) {
            // Parent folder(s) have been deleted
            return null;
        }
        const pathSegments = pathAssets.map(a => a.get('name'));
        return `/${[...pathSegments, asset.get('file').filename].join('/')}`;
    };
    editor.method('assets:virtualPath', assetVirtualPath);

    editor.method('assets:realPath', (asset: Observer) => {
        return `/api/assets/${asset.get('id')}/file/${asset.get('name')}?branchId=${config.self.branch.id}`;
    });

    editor.method('assets:getByVirtualPath', (path: string) => assetToVirtualPath.get(path));
});
