import { mcp, PROTOCOL_VERSION } from '@/editor/mcp/connection';

/**
 * MCP "runtime" peer for the launch page (ported from the former Chrome extension's
 * launch content script). Captures console output while an MCP session owns the page,
 * and answers `runtime:*` calls the editor relays here over postMessage — no socket of its own.
 */

const LOG_CAP = 1000;

// re-announce so an editor reload can re-adopt this still-running app
const ANNOUNCE_INTERVAL = 5000;

type LogEntry = { time: number; level: string; text: string };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const logs: LogEntry[] = [];
const LEVELS = ['log', 'info', 'warn', 'error', 'debug'] as const;
const native = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
};

// our own logging uses the native console, so it never buffers into runtime:logs
const log = (msg: string) => native.log.call(console, `[MCP] ${msg}`);

const push = (level: string, args: any[], stack?: string) => {
    const text = args
        .map((a) => {
            if (typeof a === 'string') {
                return a;
            }
            try {
                return JSON.stringify(a);
            } catch {
                return String(a);
            }
        })
        .join(' ');
    logs.push({ time: Date.now(), level, text: stack ? `${text}\n${stack}` : text });
    if (logs.length > LOG_CAP) {
        logs.shift();
    }
};

// wrapping console reassigns every call site here, so only while relaying (offer → detach);
// a plain Launch keeps native stack traces
let capturing = false;

const startCapture = () => {
    if (capturing) {
        return;
    }
    capturing = true;
    LEVELS.forEach((level) => {
        console[level] = (...args: any[]) => {
            push(level, args);
            native[level].apply(console, args);
        };
    });
};

const stopCapture = () => {
    if (!capturing) {
        return;
    }
    capturing = false;
    LEVELS.forEach((level) => {
        console[level] = native[level];
    });
};

window.addEventListener('error', (e) => {
    if (capturing) {
        push('error', [e.message], e.error?.stack || `${e.filename}:${e.lineno}:${e.colno}`);
    }
});
window.addEventListener('unhandledrejection', (e) => {
    if (capturing) {
        push('error', [`Unhandled promise rejection: ${e.reason?.message ?? e.reason}`], e.reason?.stack);
    }
});

mcp.method('runtime:ping', () => ({ data: 'pong' }));

mcp.method(
    'runtime:capture',
    () =>
        new Promise<{ data?: any; error?: string; meta?: Record<string, any> }>((resolve) => {
            const app = editor.call('viewport:app');
            if (!app || !app.graphicsDevice) {
                resolve({
                    error: 'Runtime app not ready yet. Wait for the scene to finish loading (poll read_runtime_logs) and retry.'
                });
                return;
            }
            const device = app.graphicsDevice;
            const gl = device.gl;
            if (!gl) {
                resolve({ error: 'WebGL context not found on the runtime app.' });
                return;
            }

            // read the backbuffer at the end of a frame, while it is still valid
            const onEnd = () => {
                app.off('frameend', onEnd);
                try {
                    const width = device.width;
                    const height = device.height;

                    const pixels = new Uint8Array(width * height * 4);
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                    // flip vertically (WebGL reads bottom-to-top)
                    const flipped = new Uint8Array(width * height * 4);
                    const rowSize = width * 4;
                    for (let y = 0; y < height; y++) {
                        flipped.set(pixels.subarray((height - 1 - y) * rowSize, (height - y) * rowSize), y * rowSize);
                    }

                    const srcCanvas = document.createElement('canvas');
                    srcCanvas.width = width;
                    srcCanvas.height = height;
                    const srcCtx = srcCanvas.getContext('2d')!;
                    srcCtx.putImageData(new ImageData(new Uint8ClampedArray(flipped.buffer), width, height), 0, 0);

                    const maxWidth = 800;
                    let dstWidth = width;
                    let dstHeight = height;
                    if (width > maxWidth) {
                        dstWidth = maxWidth;
                        dstHeight = Math.round(height * (maxWidth / width));
                    }

                    const dstCanvas = document.createElement('canvas');
                    dstCanvas.width = dstWidth;
                    dstCanvas.height = dstHeight;
                    dstCanvas.getContext('2d')!.drawImage(srcCanvas, 0, 0, dstWidth, dstHeight);

                    const base64 = dstCanvas.toDataURL('image/webp', 0.8).split(',')[1];
                    log(`Captured runtime screenshot (${dstWidth}x${dstHeight})`);
                    resolve({ data: base64, meta: { mimeType: 'image/webp', width: dstWidth, height: dstHeight } });
                } catch (e: any) {
                    resolve({ error: `Failed to capture runtime: ${e.message}` });
                }
            };
            app.on('frameend', onEnd);
        })
);

mcp.method('runtime:logs', (options: any = {}) => {
    const order: Record<string, number> = { debug: 0, log: 1, info: 1, warn: 2, error: 3 };
    const minLevel = options.level && options.level !== 'all' ? (order[options.level] ?? 0) : 0;
    const keyword = options.keyword ? String(options.keyword).toLowerCase() : null;

    let filtered = logs.filter((entry) => (order[entry.level] ?? 1) >= minLevel);
    if (keyword) {
        filtered = filtered.filter((entry) => entry.text.toLowerCase().includes(keyword));
    }

    // newest first so the most recent entries are returned by default
    filtered = filtered.slice().reverse();

    const total = filtered.length;
    const limit = Number.isFinite(options.limit) ? Math.max(0, options.limit) : 100;
    const offset = Number.isFinite(options.offset) ? Math.max(0, options.offset) : 0;
    const page = limit > 0 ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
    const end = offset + page.length;
    const hasMore = end < total;

    return {
        data: page,
        meta: {
            total,
            count: page.length,
            hasMore,
            nextCursor: hasMore ? String(end) : null
        }
    };
});

/**
 * Round a number to 4 decimals to keep runtime-state payloads compact and free of
 * float noise (e.g. 1.0000000002 -> 1).
 *
 * @param n - The number to round.
 * @returns The rounded number.
 */
const round = (n: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 1e4) / 1e4 : n);

/**
 * Build a compact, non-visual snapshot of a live runtime entity — the ground-truth
 * read-back that lets the agent confirm behaviour (did the ball move? did the score
 * update?) without guessing screenshot timing.
 *
 * @param e - The pc.Entity instance.
 * @returns The runtime state summary.
 */
const entityRuntimeState = (e: any) => {
    const p = e.getPosition();
    const lp = e.getLocalPosition();
    const r = e.getEulerAngles();
    const s = e.getLocalScale();
    const state: Record<string, any> = {
        name: e.name,
        guid: e.guid,
        enabled: e.enabled,
        position: [round(p.x), round(p.y), round(p.z)],
        localPosition: [round(lp.x), round(lp.y), round(lp.z)],
        rotation: [round(r.x), round(r.y), round(r.z)],
        scale: [round(s.x), round(s.y), round(s.z)],
        components: Object.keys(e.c || {})
    };
    if (e.rigidbody) {
        const lv = e.rigidbody.linearVelocity;
        const av = e.rigidbody.angularVelocity;
        state.rigidbody = {
            type: e.rigidbody.type,
            mass: e.rigidbody.mass,
            enabled: e.rigidbody.enabled,
            linearVelocity: lv ? [round(lv.x), round(lv.y), round(lv.z)] : null,
            angularVelocity: av ? [round(av.x), round(av.y), round(av.z)] : null
        };
    }
    if (e.collision) {
        state.collision = { type: e.collision.type, enabled: e.collision.enabled };
    }
    if (e.element) {
        state.element = { type: e.element.type, text: e.element.text };
    }
    return state;
};

mcp.method('runtime:state', (options: any = {}) => {
    const app = editor.call('viewport:app');
    if (!app || !app.root) {
        return {
            error: 'Runtime app not ready yet. Wait for the scene to finish loading (poll read_runtime_logs) and retry.'
        };
    }

    let entities;
    if (Array.isArray(options.ids) && options.ids.length) {
        entities = options.ids.map((id: string) => app.root.findByGuid(id)).filter(Boolean);
    } else if (options.name) {
        const q = String(options.name).toLowerCase();
        entities = app.root.find(
            (n: any) => typeof n.getGuid === 'function' && n.name && n.name.toLowerCase().includes(q)
        );
    } else {
        // no filter: every entity (paginated), minus the root
        entities = app.root.find((n: any) => typeof n.getGuid === 'function' && n !== app.root);
    }

    const total = entities.length;
    const limit = Number.isFinite(options.limit) ? Math.max(0, options.limit) : 50;
    const offset = Number.isFinite(options.offset) ? Math.max(0, options.offset) : 0;
    const page = limit > 0 ? entities.slice(offset, offset + limit) : entities.slice(offset);
    const end = offset + page.length;
    const hasMore = end < total;

    log(`Queried runtime state (${page.length}/${total})`);
    return {
        data: page.map(entityRuntimeState),
        meta: {
            total,
            count: page.length,
            hasMore,
            nextCursor: hasMore ? String(end) : null
        }
    };
});

const SPECIAL_KEYS: Record<string, { key: string; code: string; keyCode: number }> = {
    ' ': { key: ' ', code: 'Space', keyCode: 32 },
    space: { key: ' ', code: 'Space', keyCode: 32 },
    enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
    return: { key: 'Enter', code: 'Enter', keyCode: 13 },
    escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
    esc: { key: 'Escape', code: 'Escape', keyCode: 27 },
    tab: { key: 'Tab', code: 'Tab', keyCode: 9 },
    backspace: { key: 'Backspace', code: 'Backspace', keyCode: 8 },
    delete: { key: 'Delete', code: 'Delete', keyCode: 46 },
    shift: { key: 'Shift', code: 'ShiftLeft', keyCode: 16 },
    control: { key: 'Control', code: 'ControlLeft', keyCode: 17 },
    ctrl: { key: 'Control', code: 'ControlLeft', keyCode: 17 },
    alt: { key: 'Alt', code: 'AltLeft', keyCode: 18 },
    arrowleft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    left: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
    arrowup: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    up: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
    arrowright: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
    arrowdown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
    down: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 }
};

/**
 * Resolve a friendly key name into the fields PlayCanvas / the DOM expect.
 *
 * @param raw - The key name (e.g. 'w', 'Space', 'ArrowUp').
 * @returns Key descriptor.
 */
const keyInfo = (raw: string) => {
    const k = String(raw);
    const special = SPECIAL_KEYS[k.toLowerCase()];
    if (special) {
        return special;
    }
    if (k.length === 1) {
        const code = k.toUpperCase().charCodeAt(0);
        if (/[a-z]/i.test(k)) {
            return { key: k, code: `Key${k.toUpperCase()}`, keyCode: code };
        }
        if (/[0-9]/.test(k)) {
            return { key: k, code: `Digit${k}`, keyCode: code };
        }
        return { key: k, code: k, keyCode: code };
    }
    return { key: k, code: k, keyCode: 0 };
};

const getCanvas = (): HTMLCanvasElement | null => {
    const app = editor.call('viewport:app');
    return (app && app.graphicsDevice && app.graphicsDevice.canvas) || document.querySelector('canvas') || null;
};

const dispatchKey = (kind: string, info: { key: string; code: string; keyCode: number }) => {
    const e = new KeyboardEvent(kind, {
        key: info.key,
        code: info.code,
        bubbles: true,
        cancelable: true,
        view: window
    });

    // keyCode/which are read-only in the ctor but PlayCanvas reads them, so back them with getters
    Object.defineProperty(e, 'keyCode', { get: () => info.keyCode });
    Object.defineProperty(e, 'which', { get: () => info.keyCode });
    window.dispatchEvent(e);
    document.dispatchEvent(e);
};

const dispatchMouse = (kind: string, canvas: HTMLCanvasElement, x?: number, y?: number, button?: number) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + (x || 0);
    const clientY = rect.top + (y || 0);
    const buttons = kind === 'mousedown' ? (button === 2 ? 2 : button === 1 ? 4 : 1) : 0;
    canvas.dispatchEvent(
        new MouseEvent(kind, {
            clientX,
            clientY,
            button: button || 0,
            buttons,
            bubbles: true,
            cancelable: true,
            view: window
        })
    );
};

const dispatchTouch = (kind: string, canvas: HTMLCanvasElement, x?: number, y?: number, id?: number) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + (x || 0);
    const clientY = rect.top + (y || 0);
    const touch = new Touch({
        identifier: id || 0,
        target: canvas,
        clientX,
        clientY,
        pageX: clientX,
        pageY: clientY,
        radiusX: 1,
        radiusY: 1,
        force: 1
    });
    const active = kind === 'touchend' ? [] : [touch];
    canvas.dispatchEvent(
        new TouchEvent(kind, {
            touches: active,
            targetTouches: active,
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
            view: window
        })
    );
};

mcp.method('runtime:input', async (payload: any = {}) => {
    const events = Array.isArray(payload.events) ? payload.events : [];
    if (!events.length) {
        return { error: 'No input events provided.' };
    }
    const canvas = getCanvas();
    if (!canvas) {
        return {
            error: 'Runtime canvas not found. Ensure launch_start succeeded and the scene has loaded, then retry.'
        };
    }
    const betweenMs = Number.isFinite(payload.betweenMs) ? payload.betweenMs : 0;

    let dispatched = 0;
    for (const ev of events) {
        if (ev.type === 'key') {
            const info = keyInfo(ev.key);
            const action = ev.action || 'press';
            const repeat = Math.max(1, ev.repeat || 1);
            for (let i = 0; i < repeat; i++) {
                if (action === 'down') {
                    dispatchKey('keydown', info);
                } else if (action === 'up') {
                    dispatchKey('keyup', info);
                } else {
                    dispatchKey('keydown', info);
                    if (ev.holdMs) {
                        await wait(ev.holdMs);
                    }
                    dispatchKey('keyup', info);
                }
                dispatched++;
            }
        } else if (ev.type === 'mouse') {
            if (ev.action === 'click') {
                dispatchMouse('mousedown', canvas, ev.x, ev.y, ev.button);
                dispatchMouse('mouseup', canvas, ev.x, ev.y, ev.button);
            } else {
                dispatchMouse(`mouse${ev.action}`, canvas, ev.x, ev.y, ev.button);
            }
            dispatched++;
        } else if (ev.type === 'touch') {
            if (ev.action === 'tap') {
                dispatchTouch('touchstart', canvas, ev.x, ev.y, ev.id);
                dispatchTouch('touchend', canvas, ev.x, ev.y, ev.id);
            } else {
                dispatchTouch(`touch${ev.action}`, canvas, ev.x, ev.y, ev.id);
            }
            dispatched++;
        }
        if (betweenMs) {
            await wait(betweenMs);
        }
    }
    log(`Injected ${dispatched} input event(s)`);
    return { data: { dispatched } };
});

// the editor relays `runtime:*` here over postMessage; it makes first contact (opener severed),
// then we keep announcing ourselves
const EDITOR_ORIGIN = new URL(config.url.home).origin;

let editorWindow: Window | null = null;
let announceTimer: ReturnType<typeof setInterval> | null = null;

const announce = () => {
    editorWindow?.postMessage(
        {
            mcp: 'ready',
            protocolVersion: PROTOCOL_VERSION,
            projectId: config.project?.id,
            sceneId: (config as { scene?: { id: number } }).scene?.id,
            url: location.href,
            methods: mcp.methodNames.filter((name) => name.startsWith('runtime:'))
        },
        EDITOR_ORIGIN
    );
};

window.addEventListener('message', async (evt: MessageEvent) => {
    if (evt.origin !== EDITOR_ORIGIN || !evt.data || !evt.source) {
        return;
    }
    const msg = evt.data;
    if (msg.mcp === 'offer') {
        editorWindow = evt.source as Window;
        startCapture();
        log('Relay attached');
        announce();
        announceTimer ??= setInterval(announce, ANNOUNCE_INTERVAL);
        return;
    }
    if (msg.mcp === 'detach') {
        if (announceTimer) {
            clearInterval(announceTimer);
            announceTimer = null;
        }
        editorWindow = null;
        stopCapture();
        return;
    }
    if (msg.mcp === 'close') {
        // the editor severed our opener, so only we can close this window
        window.close();
        return;
    }
    if (msg.mcp === 'call') {
        const res = await mcp.call(msg.name, ...(msg.args ?? []));
        (evt.source as Window).postMessage({ mcp: 'res', id: msg.id, res }, EDITOR_ORIGIN);
    }
});

window.addEventListener('beforeunload', () => {
    editorWindow?.postMessage({ mcp: 'gone' }, EDITOR_ORIGIN);
});
