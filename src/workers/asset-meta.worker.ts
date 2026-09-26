import { animationMeta } from '@/common/asset-meta/animation';
import { gsplatMeta } from '@/common/asset-meta/gsplat';
import { modelMeta } from '@/common/asset-meta/model';
import { isNormalMap, textureMeta } from '@/common/asset-meta/texture';
import { WorkerServer } from '@/core/worker/worker-server';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

// decoding for normal-map detection costs width * height * 4 bytes; bigger textures go to the server
const MAX_PIXELS = 8192 * 8192;

const bytes = async (file: Blob) => new Uint8Array(await file.arrayBuffer());

const texture = async (file: Blob, name?: string) => {
    const meta = textureMeta(await bytes(file), name);
    if (!meta || meta.width * meta.height > MAX_PIXELS) {
        return null;
    }

    // float images are never normal maps (detectNormalmap); anything the browser can't decode
    // throws, which leaves it to the server
    let normals = false;
    if (meta.format !== 'hdr') {
        const bitmap = await createImageBitmap(file, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
        const { width, height } = bitmap;
        const ctx = new OffscreenCanvas(width, height).getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        normals = isNormalMap(ctx.getImageData(0, 0, width, height).data);
    }
    return { ...meta, compress: { normals } };
};

const run: Record<string, (file: Blob, name: string) => Promise<object | null>> = {
    texture,
    model: async (file, name) => modelMeta(await bytes(file), name),
    animation: async (file, name) => animationMeta(await bytes(file), name),
    gsplat: (file, name) => gsplatMeta(file, name)
};

// every failure answers null, which sends the upload down the server meta path
workerServer.on('meta', (id: number, kind: string, file: Blob, name = '') => {
    Promise.resolve()
        .then(() => run[kind](file, name))
        .then(
            (meta) => workerServer.send('meta', id, meta ?? null),
            () => workerServer.send('meta', id, null)
        );
});
