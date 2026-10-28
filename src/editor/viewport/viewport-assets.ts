import type { Observer } from '@playcanvas/observer';
import type { Asset } from 'playcanvas';
import { StandardMaterial, Vec2, Vec4 } from 'playcanvas';

import { formatter as f } from '@/common/utils';

editor.once('load', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return;
    }

    const assets = app.assets;

    editor.call('assets:registry:bind', assets);

    // a failed load otherwise only reaches the devtools console and the asset silently doesn't show.
    // log each distinct failure once per asset until it loads again
    const failures = new Map<number, string>();
    assets.on('error', (err: unknown, engineAsset: Asset) => {
        const asset = editor.call('assets:get', engineAsset.id);
        const reason = `${err instanceof Error ? err.message : err}`;
        if (!asset || failures.get(engineAsset.id) === reason) {
            return;
        }
        failures.set(engineAsset.id, reason);

        const [uiMsg, verboseMsg] = f.parse(`Failed to load ${f.asset(asset)}: ${reason}`);
        editor.call('console:error', uiMsg, verboseMsg, () => {
            editor.call('selector:set', 'asset', [asset]);
        });
    });
    assets.on('load', (engineAsset: Asset) => {
        failures.delete(engineAsset.id);
    });

    const regexFrameUpdate = /^data\.frames\.(\d+)/;
    const regexFrameRemove = /^data\.frames\.(\d+)$/;
    const regexSrgb = /^data\.srgb$/;
    const regexI18n = /^i18n\.[^.]+$/;

    // add assets to asset registry
    editor.on('assets:add', (asset: Observer) => {
        // do only for target assets
        if (asset.get('source')) {
            return;
        }

        const assetEngine = assets.get(asset.get('id'));
        // render on asset load
        assetEngine.on('load', () => {
            editor.call('viewport:render');
        });
        // render on asset data change
        assetEngine.on('change', () => {
            editor.call('viewport:render');
        });

        // when data is changed
        asset.on('*:set', (path: string, value: unknown) => {
            // handle i18n changes
            if (regexI18n.test(path)) {
                const parts = path.split('.');
                assetEngine.addLocalizedAssetId(parts[1], value);
            } else if (asset.get('type') === 'textureatlas') {
                // handle frame changes for texture atlas
                const match = path.match(regexFrameUpdate);
                if (match) {
                    const frameKey = match[1];
                    const frame = asset.get(`data.frames.${frameKey}`);

                    if (assetEngine.resource) {
                        if (frame) {
                            assetEngine.resource.setFrame(frameKey, {
                                rect: new Vec4(frame.rect),
                                pivot: new Vec2(frame.pivot),
                                border: new Vec4(frame.border)
                            });
                        }
                    }

                    if (!assetEngine.data.frames) {
                        assetEngine.data.frames = {};
                    }
                    assetEngine.data.frames[frameKey] = frame;
                } else if (regexSrgb.test(path)) {
                    assetEngine.resource.texture.srgb = value;
                }
            }

            editor.call('viewport:render');
        });

        asset.on('*:unset', (path: string) => {
            if (regexI18n.test(path)) {
                const parts = path.split('.');
                assetEngine.removeLocalizedAssetId(parts[1]);

                editor.call('viewport:render');
            } else if (asset.get('type') === 'textureatlas') {
                const match = path.match(regexFrameRemove);
                if (match) {
                    const frameKey = match[1];

                    if (assetEngine.resource) {
                        assetEngine.resource.removeFrame(frameKey);
                    }

                    if (assetEngine.frames && assetEngine.frames[frameKey]) {
                        delete assetEngine.frames;
                    }

                    editor.call('viewport:render');
                }
            }
        });

        if (asset.get('type') === 'sprite') {
            const updateFrameKeys = function () {
                if (assetEngine.resource) {
                    assetEngine.resource.frameKeys = asset.get('data.frameKeys');
                }

                assetEngine.data.frameKeys = asset.get('data.frameKeys');

                editor.call('viewport:render');
            };

            asset.on('data.frameKeys:set', updateFrameKeys);
            asset.on('data.frameKeys:insert', updateFrameKeys);
            asset.on('data.frameKeys:remove', updateFrameKeys);
            asset.on('data.frameKeys:move', updateFrameKeys);
        }

        // render
        editor.call('viewport:render');
    });

    // remove assets from asset registry
    editor.on('assets:remove', (_asset: Observer) => {
        // re-render
        editor.call('viewport:render');
    });

    // patch update for materials to re-render the viewport
    const update = StandardMaterial.prototype.update as (this: StandardMaterial) => void;
    StandardMaterial.prototype.update = function (this: StandardMaterial): void {
        update.call(this);
        editor.call('viewport:render');
    };
});
