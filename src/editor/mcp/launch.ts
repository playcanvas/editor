import { config } from '@/editor/config';

import { mcp } from './connection';
import { relay } from './relay';

const log = (msg: string) => console.log(`[MCP] ${msg}`);

// how long a running window has to answer the relay offer before we relaunch
const ADOPT_TIMEOUT = 5000;
const CLOSE_POLL = 100;
const CLOSE_ATTEMPTS = 10;

// handle to the launched window, so we can stop it later
let runtimeWindow: Window | null = null;

/**
 * Close the current launch window — ours, or one handed to the relay by the Launch button —
 * and confirm it went. The page closes itself where we can't.
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
            await new Promise((resolve) => setTimeout(resolve, CLOSE_POLL));
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

    // no options: adopt a running app instead of restarting the session
    if (!Object.keys(options).length) {
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

            // different scene, or a build without the relay: leave it and relaunch
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

    // a local build must launch the local page, like the Launch button
    const search = new URLSearchParams(location.search);
    for (const flag of ['use_local_frontend', 'use_local_engine']) {
        if (search.has(flag)) {
            params.set(flag, search.get(flag) ?? '');
        }
    }

    const url = `${base}${sceneId}?${params.toString()}`;

    await closeCurrent();

    // open blank so the opener can be severed before the page loads
    runtimeWindow = window.open('', '_blank');
    if (!runtimeWindow) {
        return {
            error: 'Could not open the launch window (popup blocked). Allow popups for the editor origin and retry.'
        };
    }

    // sever the opener: project scripts get no editor handle, and we close via the page (closeCurrent)
    runtimeWindow.opener = null;
    runtimeWindow.location = url;
    editor.call('launch:window:track', runtimeWindow);
    relay.attach(runtimeWindow);
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
