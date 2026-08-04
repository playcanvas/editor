import { Asset } from 'playcanvas';

import type { AssetObserver } from '@/editor-api';

editor.once('load', () => {
    editor.method(
        'assets:registry:bind',
        (
            assetRegistry: {
                get: (id: number) => { unload: () => void };
                add: (asset: Asset) => void;
                remove: (asset: Asset) => void;
            },
            assetTypes: string[] | undefined
        ) => {
            // add assets to asset registry
            editor.on('assets:add', (asset: AssetObserver) => {
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
                    file: assetJson.file
                        ? {
                              filename: assetJson.file.filename,
                              url: assetJson.file.url,
                              hash: assetJson.file.hash,
                              size: assetJson.file.size,
                              variants: assetJson.file.variants || null
                          }
                        : null,
                    data: assetJson.data,
                    type: assetJson.type
                };

                // a referenced font cannot be served from a bundle, and the engine derives a bundled
                // font's atlas page urls from data.info.maps, which it does not have, throwing mid-index
                // and abandoning the rest of the bundle's urls. the viewport has bundles disabled so
                // this is currently only reached on a re-add, but keep it consistent with launch and
                // with the export, which both drop it from the bundle too
                if (data.type === 'bundle' && data.data && data.data.assets) {
                    data.data = {
                        ...data.data,
                        assets: data.data.assets.filter((id: number) => {
                            const member = editor.call('assets:get', id);
                            return !(member && member.get('type') === 'font' && member.has('data.jsonAsset'));
                        })
                    };
                }

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
                const updatedFields = {};

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

                    // a referenced font is rebuilt by assets-font-import once its mirrors have loaded,
                    // so pushing `data` or the placeholder `file` at the engine asset here would
                    // instead reload it from refs whose targets are not ready. the delete also drops a
                    // `data` flush queued earlier in this tick, which is how a font mid-conversion
                    // (legacy op first, then the jsonAsset write) reaches here already flagged.
                    if (asset.get('type') === 'font' && asset.has('data.jsonAsset')) {
                        delete updatedFields[field];
                        return;
                    }

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
            editor.on('assets:remove', (asset: AssetObserver) => {
                const item = assetRegistry.get(asset.get('id'));
                if (item) {
                    item.unload();
                    assetRegistry.remove(item);
                }
            });
        }
    );
});
