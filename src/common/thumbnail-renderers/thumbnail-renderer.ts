// Required for Editor blank page, where "pc" is not loaded.
const pc = typeof window.pc !== 'undefined' ? window.pc : {
    Layer: class {},
    RenderTarget: class {},
    LayerComposition: class {}
};

import { Observer } from '@playcanvas/observer';
import type { GraphicsDevice } from 'playcanvas';

/**
 * Singleton Thumbnail Renderer
 */
class ThumbnailRenderer extends Observer {
    static renderTargets = new Map();

    static _layer = new pc.Layer({
        name: 'ThumbnailRendererLayer',
        id: -1,
        enabled: true,
        opaqueSortMode: 2,
        transparentSortMode: 3
    });

    static _layerComposition;

    getRenderTarget(device: GraphicsDevice, width: number, height: number) {

        const key = `${width}-${height}`;
        let target = ThumbnailRenderer.renderTargets.get(key);

        if (!target) {
            const texture = new pc.Texture(device, {
                name: `ThumbnailRendererTexture-${key}`,
                width: width,
                height: height,
                format: pc.PIXELFORMAT_RGBA8
            });

            target = new pc.RenderTarget({
                colorBuffer: texture
            });
            ThumbnailRenderer.renderTargets.set(key, target);

            target.buffer = new ArrayBuffer(width * height * 4);
            target.pixels = new Uint8Array(target.buffer);
            target.pixelsClamped = new Uint8ClampedArray(target.buffer);
        }

        return target;
    }

    get layer() {
        return ThumbnailRenderer._layer;
    }

    get layerComposition() {
        if (!ThumbnailRenderer._layerComposition) {
            ThumbnailRenderer._layerComposition = new pc.LayerComposition('thumbnail-renderer');
            ThumbnailRenderer._layerComposition.push(ThumbnailRenderer._layer);
        }
        return ThumbnailRenderer._layerComposition;
    }
}

export { ThumbnailRenderer };
