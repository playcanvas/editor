import { config } from '@/editor/config';

import { mcp, PROTOCOL_VERSION } from './connection';

/**
 * Editor half of the runtime relay: the editor holds the only socket and forwards `runtime:*`
 * to the launch window over postMessage, so that origin needs no local access grant of its
 * own. The editor must make first contact — the launch window's `opener` is severed.
 */

const LAUNCH_ORIGIN = new URL(config.url.launch).origin;
const OFFER_INTERVAL = 250;
const OFFER_TIMEOUT = 30_000;

// under the server's 60s so the agent gets our error rather than a generic timeout
const CALL_TIMEOUT = 55_000;
const WINDOW_POLL = 1000;
const CLOSE_POLL = 100;
const CLOSE_ATTEMPTS = 20;

type Reply = { data?: any; error?: string; meta?: Record<string, any> };
type Peer = { window: Window; methods: string[]; sceneId?: string; projectId?: number; url?: string };

const log = (msg: string) => console.log(`[MCP] ${msg}`);

let offered: Window | null = null;
let peer: Peer | null = null;
let offerDeadline = 0;
let offerTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let id = 0;

const pending = new Map<number, (res: Reply) => void>();
const waiters = new Set<(peer: Peer | null) => void>();

// sent even when empty, so the server knows this editor relays at all
const announce = () => {
    mcp.send({
        runtime: peer ? { protocolVersion: PROTOCOL_VERSION, methods: peer.methods } : null
    });
};

const settle = (value: Peer | null) => {
    waiters.forEach((resolve) => resolve(value));
    waiters.clear();
};

const drop = (reason: string) => {
    if (!peer) {
        return;
    }
    const win = peer.window;
    peer = null;
    // a still-open window we're dropping should restore its console and stop announcing
    if (!win.closed) {
        win.postMessage({ mcp: 'detach' }, LAUNCH_ORIGIN);
    }
    pending.forEach((resolve) => resolve({ error: 'The launched app disconnected mid-call. Run launch_start again.' }));
    pending.clear();
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
    log(`Runtime relay dropped (${reason})`);
    announce();
    settle(null);
};

const offer = () => {
    offerTimer = null;
    if (!offered || peer) {
        return;
    }
    if (offered.closed || Date.now() > offerDeadline) {
        log('Launch page never answered the relay offer');
        offered = null;
        settle(null);
        return;
    }
    offered.postMessage({ mcp: 'offer' }, LAUNCH_ORIGIN);
    offerTimer = setTimeout(offer, OFFER_INTERVAL);
};

window.addEventListener('message', (evt: MessageEvent) => {
    if (evt.origin !== LAUNCH_ORIGIN || !evt.data || !evt.source) {
        return;
    }
    const msg = evt.data;

    if (msg.mcp === 'ready') {
        // the user may have another project's app running in a second window
        if (config.project?.id !== undefined && msg.projectId !== config.project.id) {
            return;
        }
        const known = peer?.window === evt.source;
        peer = {
            window: evt.source as Window,
            methods: (msg.methods ?? []).filter(
                (name: unknown) => typeof name === 'string' && name.startsWith('runtime:')
            ),
            sceneId: msg.sceneId,
            projectId: msg.projectId,
            url: msg.url
        };
        if (!known) {
            log(`Runtime relay ready (scene ${msg.sceneId})`);
            if (offerTimer) {
                clearTimeout(offerTimer);
                offerTimer = null;
            }
            // the launch window can be closed by the user at any point
            pollTimer ??= setInterval(() => peer?.window.closed && drop('window closed'), WINDOW_POLL);
            announce();
        }
        settle(peer);
        return;
    }

    if (msg.mcp === 'gone' && peer?.window === evt.source) {
        drop('launch page unloaded');
        return;
    }

    if (msg.mcp === 'res' && peer?.window === evt.source) {
        const resolve = pending.get(msg.id);
        if (resolve) {
            pending.delete(msg.id);
            resolve(msg.res ?? {});
        }
    }
});

// the server tracks the relay per connection, so re-announce after a reconnect
mcp.on('status', (status: string) => status === 'connected' && announce());

const relay = {
    /**
     * Offer the relay to a launch window. Repeat calls are safe; the newest window wins.
     *
     * @param win - The launch window to adopt.
     */
    attach(win: Window) {
        if (peer && peer.window !== win) {
            drop('replaced by a new launch window');
        }
        offered = win;
        offerDeadline = Date.now() + OFFER_TIMEOUT;
        if (!offerTimer) {
            offer();
        }
    },

    /**
     * Stop relaying and forget the current launch window.
     */
    detach() {
        offered = null;
        if (offerTimer) {
            clearTimeout(offerTimer);
            offerTimer = null;
        }
        drop('detached');
        settle(null);
    },

    /**
     * The launch page currently reachable through the relay, if any.
     */
    get peer() {
        return peer;
    },

    /**
     * Wait for a launch page to answer the offer.
     *
     * @param timeoutMs - How long to wait before giving up.
     * @returns The peer, or null if none answered in time.
     */
    ready(timeoutMs: number) {
        if (peer) {
            return Promise.resolve(peer);
        }
        return new Promise<Peer | null>((resolve) => {
            const timer = setTimeout(() => {
                waiters.delete(done);
                resolve(null);
            }, timeoutMs);
            const done = (value: Peer | null) => {
                clearTimeout(timer);
                resolve(value);
            };
            waiters.add(done);
        });
    },

    /**
     * Ask the launch page to close itself and confirm it went: a window whose opener we
     * severed can't be closed from here.
     *
     * @returns True once the window is gone.
     */
    async close() {
        const win = peer?.window;
        if (!win || win.closed) {
            return false;
        }
        win.postMessage({ mcp: 'close' }, LAUNCH_ORIGIN);
        for (let i = 0; i < CLOSE_ATTEMPTS && !win.closed; i++) {
            await new Promise((resolve) => setTimeout(resolve, CLOSE_POLL));
        }
        if (win.closed) {
            drop('closed on request');
            return true;
        }
        return false;
    },

    /**
     * Forward a `runtime:*` call to the launch page and await its reply.
     *
     * @param name - The method name.
     * @param args - The method arguments.
     * @returns The launch page's result, or an error result.
     */
    call(name: string, args: any[]): Promise<Reply> {
        if (!peer || peer.window.closed) {
            return Promise.resolve({
                error: 'No running instance connected. Call launch_start first; the editor relays to the launched page automatically.'
            });
        }
        const callId = id++;
        return new Promise<Reply>((resolve) => {
            const timer = setTimeout(() => {
                pending.delete(callId);
                resolve({
                    error: `Timed out after ${CALL_TIMEOUT}ms waiting for the launched app to handle '${name}'.`
                });
            }, CALL_TIMEOUT);
            pending.set(callId, (res) => {
                clearTimeout(timer);
                resolve(res);
            });
            peer!.window.postMessage({ mcp: 'call', id: callId, name, args }, LAUNCH_ORIGIN);
        });
    }
};

// everything else is not ours
mcp.fallback((name, args) => (name.startsWith('runtime:') ? relay.call(name, args) : null));

// the Launch button hands its windows over here
editor.method('mcp:relay:attach', (win: Window) => relay.attach(win));
editor.method('mcp:relay:peer', () => !!peer && !peer.window.closed);

export { relay };
