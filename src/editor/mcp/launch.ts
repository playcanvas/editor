import { config } from '@/editor/config';

import { mcp } from './connection';

const log = (msg: string) => console.log(`[MCP] ${msg}`);

// remember a handle to the launched runtime window so we can stop it later
let runtimeWindow: Window | null = null;

// launch (runtime control)
mcp.method('launch:start', (options: any = {}) => {
    const sceneId = config.scene?.id;
    const base = config.url?.launch;
    if (!sceneId || !base) {
        return { error: 'No scene loaded, or launch URL unavailable. Load a scene in the editor and retry.' };
    }
    const params = new URLSearchParams();

    // debug=true makes the engine log warnings/errors to the console, which
    // read_runtime_logs relies on
    params.set('debug', 'true');
    if (options.device) {
        params.set('device', options.device);
    }

    // pass the MCP port so the launch page can connect back as the runtime peer
    // without any popup UI
    params.set('mcp_port', String(mcp.port));
    const url = `${base}${sceneId}?${params.toString()}`;

    if (runtimeWindow && !runtimeWindow.closed) {
        runtimeWindow.close();
    }
    runtimeWindow = window.open(url, '_blank');
    if (!runtimeWindow) {
        return {
            error: 'Could not open the launch window (popup blocked). Allow popups for the editor origin and retry.'
        };
    }
    log(`Launched runtime for scene(${sceneId})`);
    return { data: { url, sceneId } };
});
mcp.method('launch:stop', () => {
    const wasOpen = !!(runtimeWindow && !runtimeWindow.closed);
    if (runtimeWindow && !runtimeWindow.closed) {
        runtimeWindow.close();
    }
    runtimeWindow = null;
    log('Stopped runtime');
    return { data: { stopped: wasOpen } };
});
