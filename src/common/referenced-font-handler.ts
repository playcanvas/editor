import type { AppBase } from 'playcanvas';
import { FILTER_LINEAR, Font, FontHandler } from 'playcanvas';

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

// the json ref is user-editable, so the descriptor is untrusted. validate the fields the referenced
// path actually reads, and pin the version: pc.Font's data setter rewrites info.maps from
// info.width/height whenever version is missing or < 2, which NaNs every glyph UV of an otherwise
// valid descriptor. returns [error] or [null, descriptor].
export const normalizeFontJson = (json: any): [string | null, any?] => {
    if (!json || typeof json !== 'object') {
        return ['json asset is empty or not an object'];
    }
    if (!Array.isArray(json.info?.maps) || json.info.maps.length === 0) {
        return ['json asset has no info.maps array'];
    }
    const keys = json.chars && typeof json.chars === 'object' ? Object.keys(json.chars) : [];
    if (keys.length === 0) {
        return ['json asset has no chars'];
    }
    // v1/v2 descriptors key chars by codepoint; the element component looks them up by letter. compare a
    // key against its own id rather than testing for digits, so a digits-only font isn't a false positive
    const first = json.chars[keys[0]];
    if (typeof first?.id === 'number' && keys[0] !== String.fromCodePoint(first.id)) {
        return ['json asset chars are keyed by codepoint, expected letters'];
    }
    return [null, json.version >= 2 ? json : { ...json, version: 3 }];
};

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

        queueMicrotask(() => {
            const app = this._app;
            const jsonAsset = app.assets.get(asset.data.jsonAsset);
            const textureIds = asset.data.textureAssets || [];
            const texAssets = textureIds.map((id: number) => app.assets.get(id)).filter(Boolean);

            // soft-fail to a blank font rather than erroring the load: the refs are user-editable, and
            // an unresolvable one should leave the project usable. the inspector surfaces the reason.
            if (!jsonAsset || textureIds.length === 0 || texAssets.length !== textureIds.length) {
                console.warn(`referenced font ${asset.id}: json or texture reference does not resolve`);
                callback(null, EMPTY_FONT);
                return;
            }

            const toLoad = [jsonAsset, ...texAssets];
            let remaining = toLoad.length;
            let settled = false;
            const unbind: (() => void)[] = [];
            // unbind on every path: rebuildFont clears the loader cache and reloads under the same
            // key, so an error handler left over from an earlier load would fail the current one —
            // and one leaks per referenced asset per rebuild
            const settle = (err: string | null, result?: any) => {
                if (settled) {
                    return;
                }
                settled = true;
                unbind.forEach((off) => off());
                callback(err, result);
            };
            const done = () => {
                if (settled || --remaining > 0) {
                    return;
                }
                const [err, data] = normalizeFontJson(jsonAsset.resource);
                if (err) {
                    console.warn(`referenced font ${asset.id}: ${err}`);
                    settle(null, EMPTY_FONT);
                    return;
                }
                const textures = texAssets.map((a: any) => a.resource);
                // these are plain texture assets, so they arrive with the user's own settings. re-apply what
                // the stock font handler forces on its atlas: srgb corrupts the median distance
                // reconstruction (broken corners/thin strokes), and mipmaps bleed glyphs together at small
                // sizes, both of which read as "the font looks wrong" with no obvious cause.
                textures.forEach((t: any) => {
                    if (t) {
                        t.srgb = false;
                        t.mipmaps = false;
                        t.minFilter = FILTER_LINEAR;
                    }
                });
                settle(null, { data, textures });
            };
            // two passes: ready() fires synchronously for an already-loaded asset, so every handler
            // must be bound before any of them can settle the load
            toLoad.forEach((a: any) => {
                const onError = (err: string) => settle(`referenced font ${asset.id}: ${err}`);
                a.on('error', onError);
                unbind.push(() => a.off('error', onError));
            });
            toLoad.forEach((a: any) => {
                a.ready(done);
                app.assets.load(a);
            });
        });
    }

    open(url: any, data: any, asset?: any) {
        if (isReferencedFont(asset)) {
            // load() already validated the descriptor; this catches the page-count mismatch a
            // hand-repointed texture list produces (n maps declared, m textures referenced)
            const ok =
                data?.data?.chars &&
                data.data.info?.maps?.length === data.textures?.length &&
                data.textures.every(Boolean);
            if (!ok && data !== EMPTY_FONT) {
                console.warn(
                    `referenced font ${asset.id}: descriptor declares ${data?.data?.info?.maps?.length} atlas page(s) but ${data?.textures?.length} texture(s) resolved`
                );
            }
            const font = ok ? data : EMPTY_FONT;
            return new ReferencedFont(font.textures, font.data);
        }
        return this._stock.open(url, data, asset);
    }

    patch(asset: any, assets: any) {
        this._stock.patch(asset, assets);
    }
}

export { ReferencedFontHandler };
