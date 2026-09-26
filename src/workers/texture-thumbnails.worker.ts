import { THUMBNAIL_QUALITY, THUMBNAIL_SIZES, decodeRgbm } from '@/common/texture-thumbnails';
import { WorkerServer } from '@/core/worker/worker-server';
import { resizeRgba } from '@/texture-convert/pixels';

const workerServer = new WorkerServer(self as unknown as DedicatedWorkerGlobalScope);

const encode = (canvas: OffscreenCanvas) =>
    canvas.convertToBlob({ type: 'image/jpeg', quality: THUMBNAIL_QUALITY }).then((b) => b.arrayBuffer());

const generate = async (buffer: ArrayBuffer, rgbm: boolean) => {
    const [{ size }] = THUMBNAIL_SIZES;
    const src = await createImageBitmap(new Blob([buffer]));

    // canvas 'high' only downsizes like sharp; its upsizing cubic blurs, so a smaller axis is left for resizeRgba
    const w = Math.min(src.width, size);
    const h = Math.min(src.height, size);
    const bitmap = await createImageBitmap(src, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    src.close();
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';

    // flatten alpha onto black like the job (rgbm decodes the flattened values)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    let img = ctx.getImageData(0, 0, w, h);
    if (w < size || h < size) {
        const up = resizeRgba({ data: new Uint8Array(img.data.buffer), width: w, height: h }, size, size);
        img = new ImageData(new Uint8ClampedArray(up.data.buffer), size, size);
    }
    if (rgbm) {
        decodeRgbm(img.data);
    }
    ctx.putImageData(img, 0, 0);

    const out = await Promise.all(
        THUMBNAIL_SIZES.map(({ size: s }, i) => {
            if (i === 0) {
                return encode(canvas);
            }
            const small = new OffscreenCanvas(s, s);
            const sctx = small.getContext('2d');
            sctx.imageSmoothingQuality = 'high';
            sctx.drawImage(canvas, 0, 0, s, s);
            return encode(small);
        })
    );

    workerServer.with(out).send('generate', out);
};

workerServer.on('generate', (buffer: ArrayBuffer, rgbm: boolean) => {
    generate(buffer, rgbm).catch((e) => workerServer.send('error', String(e?.message ?? e)));
});
