import { Asset } from 'playcanvas';

editor.once('load', () => {
    editor.method('assets:registry:bind', (assetRegistry: { get: (id: number) => { unload: () => void }; add: (asset: Asset) => void; remove: (asset: Asset) => void }, assetTypes: string[] | undefined) => {
        // add assets to asset registry
        editor.on('assets:add', (asset: import('@/editor-api').AssetObserver) => {
            // do only for target assets
            if (asset.get('source')) {
                return;
            }

            if (assetTypes && assetTypes.indexOf(asset.get('type')) === -1) {
                return;
            }

            // raw json data
            const assetJson = asset.json();

            // engine material data
            const data = {
                id: parseInt(assetJson.id, 10),
                name: assetJson.name,
                file: assetJson.file ? {
                    filename: assetJson.file.filename,
                    url: assetJson.file.url,
                    hash: assetJson.file.hash,
                    size: assetJson.file.size,
                    variants: assetJson.file.variants || null
                } : null,
                data: assetJson.data,
                type: assetJson.type
            };

            // add to registry
            // assetRegistry.createAndAddAsset(assetJson.id, data);

            const newAsset = new Asset(data.name, data.type, data.file, data.data);
            newAsset.id = parseInt(assetJson.id, 10);

            if (assetJson.i18n) {
                for (const locale in assetJson.i18n) {
                    newAsset.addLocalizedAssetId(locale, assetJson.i18n[locale]);
                }
            }

            assetRegistry.add(newAsset);

            let timeout;
            const updatedFields = { };

            const updateFields = function () {
                const realtimeAsset = assetRegistry.get(asset.get('id'));

                for (const key in updatedFields) {
                    // this will trigger the 'update' event on the asset in the engine
                    // handling all resource loading automatically
                    realtimeAsset[key] = asset.get(key);
                    delete updatedFields[key];
                }

                timeout = null;
            };

            const checkPath = /^(data|file)\b/;
            const onUpdate = function (path: string, _value: unknown) {
                const match = path.match(checkPath);
                if (!match) {
                    return;
                }

                // skip firing change when an individual frame changes
                // for performance reasons. We handle this elsewhere
                if (asset.get('type') === 'textureatlas') {
                    if (path.startsWith('data.frames.')) {
                        return;
                    }
                }

                const field = match[0];
                updatedFields[field] = true;

                // do this in a timeout to avoid multiple sets of the same
                // fields
                if (!timeout) {
                    timeout = setTimeout(updateFields);
                }

            };

            asset.on('*:set', onUpdate);
            asset.on('*:unset', onUpdate);
        });

        // remove assets from asset registry
        editor.on('assets:remove', (asset: import('@/editor-api').AssetObserver) => {
            const item = assetRegistry.get(asset.get('id'));
            if (item) {
                item.unload();
                assetRegistry.remove(item);
            }
        });
    });
});
