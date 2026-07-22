import { Vec3 } from 'playcanvas';

import { driver } from './driver';
import { api, log } from './shared';

// reused scratch vector — camera:focus copies it synchronously, no listener retains it
const tmpVec3 = new Vec3();

// viewport
driver.method('viewport:capture', () => {
    const app = editor.call('viewport:app');
    if (!app) {
        return { error: 'Viewport app not found' };
    }

    const device = app.graphicsDevice;
    const gl = device.gl;
    if (!gl) {
        return { error: 'WebGL context not found' };
    }

    try {
        // force a render to ensure we have the latest frame
        editor.call('viewport:render');
        app.tick();

        const width = device.width;
        const height = device.height;

        // read pixels from the backbuffer
        const pixels = new Uint8Array(width * height * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        // flip the image vertically (WebGL reads bottom-to-top)
        const flipped = new Uint8Array(width * height * 4);
        const rowSize = width * 4;
        for (let y = 0; y < height; y++) {
            flipped.set(pixels.subarray((height - 1 - y) * rowSize, (height - y) * rowSize), y * rowSize);
        }

        // create source canvas with full resolution
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = width;
        srcCanvas.height = height;
        const srcCtx = srcCanvas.getContext('2d')!;
        const imageData = new ImageData(new Uint8ClampedArray(flipped.buffer), width, height);
        srcCtx.putImageData(imageData, 0, 0);

        // scale down to max 800px width while maintaining aspect ratio
        const maxWidth = 800;
        let dstWidth = width;
        let dstHeight = height;
        if (width > maxWidth) {
            dstWidth = maxWidth;
            dstHeight = Math.round(height * (maxWidth / width));
        }

        // create destination canvas and draw scaled image
        const dstCanvas = document.createElement('canvas');
        dstCanvas.width = dstWidth;
        dstCanvas.height = dstHeight;
        const dstCtx = dstCanvas.getContext('2d')!;
        dstCtx.drawImage(srcCanvas, 0, 0, dstWidth, dstHeight);

        // convert to base64 WebP for smaller file size (falls back to PNG if unsupported)
        const dataUrl = dstCanvas.toDataURL('image/webp', 0.8);
        const base64 = dataUrl.split(',')[1];

        log(`Captured viewport screenshot (${dstWidth}x${dstHeight})`);
        return { data: base64, meta: { mimeType: 'image/webp', width: dstWidth, height: dstHeight } };
    } catch (e: any) {
        return {
            error: `Failed to capture viewport: ${e.message}. Ensure a scene is loaded and the viewport is visible, then retry.`
        };
    }
});
driver.method('viewport:focus', (ids, options: any = {}) => {
    const entities = ids.map((id: string) => api.entities.get(id)).filter(Boolean);
    if (!entities.length) {
        return {
            error: 'No valid entities found. Call list_entities (or resolve_entities) to obtain valid resource_ids.'
        };
    }
    api.selection.set(entities, { history: true });

    // get camera and calculate target
    const camera = editor.call('camera:current');
    if (!camera) {
        return { error: 'Could not retrieve current camera. Ensure a scene is loaded in the editor and retry.' };
    }
    const aabb = editor.call('selection:aabb');
    if (!aabb) {
        return { error: 'Could not calculate selection bounds. The selected entities may have no renderable bounds.' };
    }

    // calculate distance based on bounding box and FOV
    let distance = Math.max(aabb.halfExtents.x, aabb.halfExtents.y, aabb.halfExtents.z);
    distance /= Math.tan((0.5 * camera.camera.fov * Math.PI) / 180.0);
    distance = distance * 1.1 + 1;

    // apply orientation if specified
    if (options.view) {
        const views: Record<string, [number, number]> = {
            top: [-90, 0],
            bottom: [90, 0],
            front: [0, 0],
            back: [0, 180],
            left: [0, -90],
            right: [0, 90],
            perspective: [-25, 45]
        };
        const angles = views[options.view];
        if (angles) {
            camera.setEulerAngles(angles[0], angles[1], 0);
        }
    } else if (options.yaw !== undefined || options.pitch !== undefined) {
        const yaw = options.yaw ?? 45;
        const pitch = options.pitch ?? -25;
        camera.setEulerAngles(pitch, yaw, 0);
    }

    // focus camera on target
    editor.call('camera:focus', aabb.center, distance);
    log(`Focused viewport on entities: ${ids.join(', ')}`);
    return { data: { focused: entities.length } };
});

// camera framing
driver.method('camera:focus:point', (point, distance) => {
    if (!Array.isArray(point) || point.length !== 3) {
        return { error: 'point must be an array [x, y, z].' };
    }
    editor.call('camera:focus', tmpVec3.set(point[0], point[1], point[2]), distance);
    log(`Focused camera on [${point.join(', ')}] at distance ${distance}`);
    return { data: { point, distance } };
});
