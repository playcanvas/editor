import type { AppBase } from 'playcanvas';
import { Font, FontHandler } from 'playcanvas';

const EMPTY_FONT = {
    data: {
        version: 3,
        info: { maps: [{ width: 1, height: 1 }] },
        chars: {
            ' ': {
                map: 0,
                width: 0,
                height: 0,
                x: 0,
                y: 0,
                xadvance: 0,
                xoffset: 0,
                yoffset: 0
            }
        }
    },
    textures: [null]
};

// referenced (client-imported) fonts carry a jsonAsset reference; server fonts never do.
// field-existence, not truthiness: a cleared picker leaves jsonAsset === null but still referenced.
export const isReferencedFont = (asset: any) =>
    !!asset && !!asset.data && Object.prototype.hasOwnProperty.call(asset.data, 'jsonAsset');

class ReferencedFont extends Font {
    destroy() {
        // textures are external asset resources and are destroyed by their owners
    }
}

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
        const textureIds = asset.data.textureAssets || [];
        const texAssets = textureIds.map((id: number) => app.assets.get(id)).filter(Boolean);

        if (!jsonAsset || textureIds.length === 0 || texAssets.length !== textureIds.length) {
            callback(null, EMPTY_FONT);
            return;
        }

        const toLoad = [jsonAsset, ...texAssets];
        let remaining = toLoad.length;
        let errored = false;
        const done = () => {
            if (errored || --remaining > 0) {
                return;
            }
            const textures = texAssets.map((a: any) => a.resource);
            // MSDF atlases hold linear signed-distance data, not colour; texture assets default to srgb,
            // which corrupts the median distance reconstruction (broken corners/thin strokes). force linear,
            // matching the stock font handler (which loads its atlas as a raw, non-srgb texture).
            textures.forEach((t: any) => {
                if (t) {
                    t.srgb = false;
                }
            });
            callback(null, {
                data: jsonAsset.resource, // v3 descriptor (font-tools shape); pc.Font consumes v3 directly
                textures
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
        if (isReferencedFont(asset)) {
            const font =
                data?.data?.chars &&
                data.data.info?.maps?.length === data.textures?.length &&
                data.textures.every(Boolean)
                    ? data
                    : EMPTY_FONT;
            return new ReferencedFont(font.textures, font.data);
        }
        return this._stock.open(url, data, asset);
    }

    patch(asset: any, assets: any) {
        this._stock.patch(asset, assets);
    }
}

export { ReferencedFontHandler };
