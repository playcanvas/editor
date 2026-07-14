import type { AppBase } from 'playcanvas';
import { Font, FontHandler } from 'playcanvas';

// referenced (client-imported) fonts carry a jsonAsset reference; server fonts never do.
// field-existence, not truthiness: a cleared picker leaves jsonAsset === null but still referenced.
export const isReferencedFont = (asset: any) =>
    !!asset && !!asset.data && Object.prototype.hasOwnProperty.call(asset.data, 'jsonAsset');

class ReferencedFontHandler {
    handlerType = 'font';

    _app: AppBase;

    _stock: FontHandler;

    constructor(app: AppBase) {
        this._app = app;
        this._stock = new FontHandler(app);
    }

    load(url: any, callback: (err: string | null, result?: any) => void, asset?: any) {
        if (!isReferencedFont(asset)) {
            this._stock.load(url, callback, asset);
            return;
        }

        const app = this._app;
        const jsonAsset = app.assets.get(asset.data.jsonAsset);
        const texAssets = (asset.data.textureAssets || [])
            .map((id: number) => app.assets.get(id))
            .filter(Boolean);

        if (!jsonAsset || texAssets.length === 0) {
            callback(`referenced font ${asset.id}: missing json or texture asset`);
            return;
        }

        const toLoad = [jsonAsset, ...texAssets];
        let remaining = toLoad.length;
        let errored = false;
        const done = () => {
            if (errored || --remaining > 0) {
                return;
            }
            callback(null, {
                data: jsonAsset.resource, // v3 descriptor (font-tools shape); pc.Font consumes v3 directly
                textures: texAssets.map((a: any) => a.resource)
            });
        };
        toLoad.forEach((a: any) => {
            a.ready(done);
            a.once('error', (err: string) => {
                if (!errored) {
                    errored = true;
                    callback(`referenced font ${asset.id}: ${err}`);
                }
            });
            app.assets.load(a);
        });
    }

    open(url: any, data: any, asset?: any) {
        if (isReferencedFont(asset) && data && data.textures) {
            return new Font(data.textures, data.data);
        }
        return this._stock.open(url, data, asset);
    }

    patch(asset: any, assets: any) {
        this._stock.patch(asset, assets);
    }
}

export { ReferencedFontHandler };
