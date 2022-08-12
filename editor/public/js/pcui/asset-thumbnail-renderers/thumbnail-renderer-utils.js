Object.assign(pcui, (function () {
    'use strict';

    class ThumbnailRendererUtils {
        static getRenderTarget(app, width, height) {
            let target = this._renderTargets[width + '-' + height];
            if (target) return target;

            const texture = new pc.Texture(app.graphicsDevice, {
                width: width,
                height: height,
                format: pc.PIXELFORMAT_R8_G8_B8_A8
            });

            target = new pc.RenderTarget({
                name: 'ThumbnailRendererRT',
                colorBuffer: texture
            });
            this._renderTargets[width + '-' + height] = target;

            target.buffer = new ArrayBuffer(width * height * 4);
            target.pixels = new Uint8Array(target.buffer);
            target.pixelsClamped = new Uint8ClampedArray(target.buffer);

            return target;
        }

        static get layer() {
            return this._layer;
        }

        static get layerComposition() {
            return this._layerComposition;
        }
    }

    // static fields (currently Firefox 67 does not support class field declarations)
    ThumbnailRendererUtils._renderTargets = {};
    ThumbnailRendererUtils._layer = new pc.Layer({
        id: -1,
        enabled: true,
        opaqueSortMode: 2,
        transparentSortMode: 3
    });

    ThumbnailRendererUtils._layerComposition = new pc.LayerComposition("thumbnail-renderer");
    ThumbnailRendererUtils._layerComposition.push(ThumbnailRendererUtils._layer);

    return {
        ThumbnailRendererUtils: ThumbnailRendererUtils
    };
})());
