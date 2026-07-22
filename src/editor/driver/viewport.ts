import { PROJECTION_ORTHOGRAPHIC, PROJECTION_PERSPECTIVE, Vec3 } from 'playcanvas';

import { driver } from './driver';
import { api, log } from './shared';

// reused scratch vector — camera:focus copies it synchronously, no listener retains it
const tmpVec3 = new Vec3();

type ViewportState = {
    cameraId?: string;
    position?: number[];
    rotation?: number[];
    projection?: 'perspective' | 'orthographic';
    orthoHeight?: number;
    grid?: { divisions?: number; size?: number };
    bones?: boolean;
    iconSize?: number;
    expanded?: boolean;
};

const viewportState = () => {
    const camera = editor.call('camera:current');
    if (!camera) {
        return null;
    }
    const grid = editor.call('settings:projectUser');
    const user = editor.call('settings:user');
    return {
        cameraId: camera.__editorName || camera.getGuid(),
        position: camera.getPosition().toArray(),
        rotation: camera.getEulerAngles().toArray(),
        projection: camera.camera.projection === PROJECTION_ORTHOGRAPHIC ? 'orthographic' : 'perspective',
        orthoHeight: camera.camera.orthoHeight,
        grid: {
            divisions: grid.get('editor.gridDivisions'),
            size: grid.get('editor.gridDivisionSize')
        },
        bones: user.get('editor.showSkeleton'),
        iconSize: user.get('editor.iconSize'),
        expanded: editor.call('viewport:expand:state')
    };
};

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
    const entities = ids.map((id: string) => api.entities.get(id));
    const missing = ids.filter((_id: string, index: number) => !entities[index]);
    if (missing.length) {
        return { error: `Entities not found: ${missing.join(', ')}. Call list_entities to obtain valid resource_ids.` };
    }
    const found = entities.filter(Boolean);
    api.selection.set(found, { history: true });

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
    return { data: { focused: found.length } };
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

driver.method('viewport:state:get', () => {
    const state = viewportState();
    return state
        ? { data: state }
        : { error: 'Could not retrieve the current viewport camera. Ensure a scene is loaded.' };
});
driver.method('viewport:state:set', (state: ViewportState = {}) => {
    let camera = editor.call('camera:current');
    if (state.cameraId !== undefined) {
        camera = editor.call('camera:get', state.cameraId) || api.entities.get(state.cameraId)?.observer.entity;
        if (!camera?.camera) {
            return {
                error: `Camera not found: ${state.cameraId}. Use an editor camera name or a camera entity resource_id.`
            };
        }
        editor.call('camera:set', camera);
    }
    if (!camera) {
        return { error: 'Could not retrieve the current viewport camera. Ensure a scene is loaded.' };
    }
    if (state.position !== undefined) {
        camera.setPosition(...state.position);
    }
    if (state.rotation !== undefined) {
        camera.setEulerAngles(...state.rotation);
    }
    if (state.projection !== undefined) {
        camera.camera.projection =
            state.projection === 'orthographic' ? PROJECTION_ORTHOGRAPHIC : PROJECTION_PERSPECTIVE;
    }
    if (state.orthoHeight !== undefined) {
        camera.camera.orthoHeight = state.orthoHeight;
    }
    const grid = editor.call('settings:projectUser');
    if (state.grid?.divisions !== undefined) {
        grid.set('editor.gridDivisions', state.grid.divisions);
    }
    if (state.grid?.size !== undefined) {
        grid.set('editor.gridDivisionSize', state.grid.size);
    }
    const user = editor.call('settings:user');
    if (state.bones !== undefined) {
        user.set('editor.showSkeleton', state.bones);
    }
    if (state.iconSize !== undefined) {
        user.set('editor.iconSize', state.iconSize);
    }
    if (state.expanded !== undefined) {
        editor.call('viewport:expand', state.expanded);
    }
    editor.call('viewport:render');
    log('Set viewport state');
    return { data: viewportState() };
});
driver.method('viewport:visibility:get', () => {
    return { data: { hidden: editor.call('entities:visibility:getHidden') || [] } };
});
driver.method('viewport:visibility:set', (ids, hidden) => {
    const missing = ids.filter((id: string) => !api.entities.get(id));
    if (missing.length) {
        return { error: `Entities not found: ${missing.join(', ')}. Call list_entities to obtain valid resource_ids.` };
    }
    editor.call('entities:visibility:set', ids, hidden);
    log(`${hidden ? 'Hid' : 'Showed'} ${ids.length} entities in the viewport`);
    return { data: { hidden: editor.call('entities:visibility:getHidden') || [] } };
});
