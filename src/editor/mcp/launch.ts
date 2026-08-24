import { config } from '@/editor/config';

import { mcp } from './connection';
import { relay } from './relay';

const log = (msg: string) => console.log(`[MCP] ${msg}`);

// how long an already-open launch window gets to answer the relay offer before we relaunch
const ADOPT_TIMEOUT = 5000;
const CLOSE_POLL = 100;
const CLOSE_ATTEMPTS = 10;

// remember a handle to the launched runtime window so we can stop it later
let runtimeWindow: Window | null = null;

/**
 * Close whichever launch window is current — ours, or one the editor's Launch button opened
 * and handed to the relay — and confirm it actually went. Asking the page to close itself
 * comes first: a window whose opener we severed, or that a previous editor document opened,
 * can't always be closed from here.
 *
 * @returns True if a window was open and is now closed.
 */
const closeCurrent = async () => {
    const target = runtimeWindow && !runtimeWindow.closed ? runtimeWindow : relay.peer?.window;
    runtimeWindow = null;
    if (!target || target.closed) {
        relay.detach();
        return false;
    }
    let closed = await relay.close();
    if (!closed) {
        target.close();
        for (let i = 0; i < CLOSE_ATTEMPTS && !target.closed; i++) {
            await new Promise(resolve => setTimeout(resolve, CLOSE_POLL));
        }
        closed = target.closed;
    }
    relay.detach();
    if (!closed) {
        log('Runtime window would not close');
    }
    return closed;
};

// launch (runtime control)
mcp.method('launch:start', async (options: any = {}) => {
    const sceneId = config.scene?.id;
    const base = config.url?.launch;
    if (!sceneId || !base) {
        return { error: 'No scene loaded, or launch URL unavailable. Load a scene in the editor and retry.' };
    }
    // when the caller asked for nothing specific, adopt an app that is already running rather
    // than throwing away a session in progress
    if (mcp.serverRelay && !Object.keys(options).length) {
        const running = relay.peer && !relay.peer.window.closed ? relay.peer : null;
        if (running?.sceneId === sceneId) {
            log('Adopted the running app');
            return { data: { url: running.url, sceneId, adopted: true } };
        }
        const last = editor.call('launch:window');
        if (!running && last?.window && !last.window.closed) {
            relay.attach(last.window);
            const adopted = await relay.ready(ADOPT_TIMEOUT);
            if (adopted?.sceneId === sceneId) {
                log('Adopted the app launched from the editor');
                return { data: { url: adopted.url, sceneId, adopted: true } };
            }
            // a different scene, or a build without the relay: leave it alone and relaunch
            relay.detach();
        }
    }

    const params = new URLSearchParams();

    params.set('debug', String(options.debug ?? true));
    if (options.device) {
        params.set('device', options.device);
    }
    if (options.engineVersion) {
        params.set('version', options.engineVersion);
    }
    if (options.profiler) {
        params.set('profile', 'true');
    }
    if (options.concatenate) {
        params.set('concatenateScripts', 'true');
    }
    if (options.bundles !== undefined) {
        params.set('useBundles', String(options.bundles));
    }
    if (options.miniStats) {
        params.set('ministats', 'true');
    }

    // carry the dev overrides the editor itself was loaded with, so a local build launches
    // the local launch page (the editor's own Launch button does the same)
    const search = new URLSearchParams(location.search);
    for (const flag of ['use_local_frontend', 'use_local_engine']) {
        if (search.has(flag)) {
            params.set(flag, search.get(flag) ?? '');
        }
    }

    // a relaying server reaches the launch page through this one, so the page needs no port
    // of its own; older servers still route to a socket the launch page opens itself
    if (!mcp.serverRelay) {
        params.set('mcp_port', String(mcp.port));
    }
    const url = `${base}${sceneId}?${params.toString()}`;

    await closeCurrent();
    // open blank first so the opener can be severed before the page loads: it runs project
    // scripts, and with the relay it never needs a handle back into the editor
    runtimeWindow = window.open('', '_blank');
    if (!runtimeWindow) {
        return {
            error: 'Could not open the launch window (popup blocked). Allow popups for the editor origin and retry.'
        };
    }
    if (mcp.serverRelay) {
        // the launch page runs project scripts and, with the relay, never needs a handle back
        // into the editor. Severing the opener also makes the window unclosable from here, so
        // only do it where closing goes through the page itself (see closeCurrent).
        runtimeWindow.opener = null;
    }
    runtimeWindow.location = url;
    editor.call('launch:window:track', runtimeWindow, true);
    if (mcp.serverRelay) {
        relay.attach(runtimeWindow);
    }
    log(`Launched runtime for scene(${sceneId})`);
    return { data: { url, sceneId, adopted: false } };
});
mcp.method('launch:stop', async () => {
    const wasOpen = !!(runtimeWindow && !runtimeWindow.closed) || !!relay.peer;
    const closed = await closeCurrent();
    if (wasOpen && !closed) {
        return { data: { stopped: false }, error: 'The launch window did not close. Close it manually, then retry.' };
    }
    log(closed ? 'Stopped runtime' : 'No runtime to stop');
    return { data: { stopped: closed } };
});
