import { Events } from '@playcanvas/observer';

import { handleRequest } from './request';

const DEFAULT_PORT = 52000;

// dial the address the server binds, not `localhost` (resolves to ::1 first on windows)
const HOST = '127.0.0.1';
const RETRY_TIMEOUT = 1000;
const PROTOCOL_VERSION = 1;

// A blocked socket is indistinguishable from "nothing is listening", so probe the permission
// when we never reach 'open'. The name changed with the Chrome 145 loopback/LAN split, so try
// each and use the first the browser recognises.
const LOCAL_ACCESS_PERMISSIONS = ['loopback-network', 'local-network', 'local-network-access'];

type Status = 'connecting' | 'connected' | 'disconnected';
type Role = 'editor' | 'runtime';
type MethodResult = { data?: any; error?: string; meta?: Record<string, any> };
type Method = (...args: any[]) => MethodResult | Promise<MethodResult>;

const log = (msg: string) => console.log(`[MCP] ${msg}`);
const error = (msg: unknown) => console.error(`[MCP] ${msg}`);

// 'denied' or 'prompt' when the permission may be the cause, null when it can't be. A
// never-asked site reads 'prompt', which is also what a missing server looks like.
const localAccessState = async () => {
    for (const name of LOCAL_ACCESS_PERMISSIONS) {
        const state = await navigator.permissions?.query({ name: name as PermissionName }).then(
            (status) => status.state,
            () => null
        );
        if (state) {
            return state === 'granted' ? null : state;
        }
    }
    return null;
};

/**
 * WebSocket client that connects the page to the external MCP server and dispatches its
 * tool requests to registered handlers. Same wire protocol as the former Chrome extension:
 * `{ id, name, args }` in, `{ id, res }` out. On open it announces its role
 * (`{ register, protocolVersion, methods }`) so the server routes edit-time vs runtime
 * methods to the correct peer.
 */
class MCPConnection extends Events {
    private _ws: WebSocket | null = null;

    private _methods = new Map<string, Method>();

    private _connectTimeout: ReturnType<typeof setTimeout> | null = null;

    private _status: Status = 'disconnected';

    private _port: number = DEFAULT_PORT;

    private _role: Role = 'editor';

    private _forceClosed = false;

    private _blocked: string | null = null;

    private _fallback: ((name: string, args: any[]) => MethodResult | Promise<MethodResult> | null) | null = null;

    get status() {
        return this._status;
    }

    get methodNames() {
        return Array.from(this._methods.keys()).sort();
    }

    get blocked() {
        return this._blocked;
    }

    get port() {
        return this._port;
    }

    private _setStatus(status: Status) {
        this._status = status;
        this.emit('status', status);
    }

    private _setBlocked(state: string | null) {
        if (this._blocked === state) {
            return;
        }
        this._blocked = state;
        if (state === 'denied') {
            error(
                'The browser is blocking this page from reaching the MCP server. Allow local access for this site in its site settings ("Apps on device" in Chrome), then reconnect.'
            );
        } else if (state === 'prompt') {
            error(
                'This page has not been allowed to reach local servers yet. Accept the browser prompt, or allow local access for this site in its site settings ("Apps on device" in Chrome). Otherwise check that the MCP server is running.'
            );
        }
        this.emit('blocked', state);
    }

    /**
     * Connect to the MCP server and keep the connection alive. If the socket drops
     * unexpectedly (server restart, transient network, background-tab throttling) we retry
     * automatically until it reconnects or disconnect() is called.
     *
     * @param port - The MCP server port to connect to.
     * @param role - The peer role announced to the server.
     */
    connect(port: number = DEFAULT_PORT, role: Role = 'editor') {
        this._port = port;
        this._role = role;
        this._forceClosed = false;

        this._setStatus('connecting');
        log(`Connecting to ws://${HOST}:${port}`);

        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }

        this._open();
    }

    /**
     * Open a single WebSocket and wire up auto-reconnect on unexpected close.
     */
    private _open() {
        const ws = new WebSocket(`ws://${HOST}:${this._port}`);
        this._ws = ws;
        let opened = false;

        ws.onopen = () => {
            opened = true;
            this._setBlocked(null);
            ws.send(
                JSON.stringify({
                    register: this._role,
                    protocolVersion: PROTOCOL_VERSION,
                    methods: Array.from(this._methods.keys()).sort()
                })
            );
            this._setStatus('connected');
            log('Connected');
        };
        ws.onmessage = async (event) => {
            const msg = await handleRequest(event.data, (name, ...args) => this.call(name, ...args));
            if ('id' in msg) {
                ws.send(JSON.stringify(msg));
            }
            if ('error' in msg) {
                error(msg.error);
            }
        };
        ws.onerror = () => {
            // a socket error is always followed by a close event, which drives the
            // reconnect below; swallow it here so it isn't surfaced as unhandled
        };
        ws.onclose = (evt) => {
            this._methods.get('files:transfer:clear')?.();
            // a deliberate disconnect() (FORCE) must never reconnect
            if (this._forceClosed || evt?.reason === 'FORCE') {
                return;
            }
            if (!opened) {
                localAccessState().then((state) => this._setBlocked(state));
            }
            this._setStatus('connecting');
            log('Disconnected; reconnecting');
            if (this._connectTimeout) {
                clearTimeout(this._connectTimeout);
            }
            this._connectTimeout = setTimeout(() => {
                this._connectTimeout = null;
                this._open();
            }, RETRY_TIMEOUT);
        };
    }

    disconnect() {
        this._forceClosed = true;
        this._methods.get('files:transfer:clear')?.();
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
            this._connectTimeout = null;
        }
        if (this._ws) {
            this._ws.close(1000, 'FORCE');
            this._ws = null;
        }
        this._setStatus('disconnected');
        log('Disconnected');
    }

    /**
     * Send a raw frame outside the request/response flow, for relay announcements.
     *
     * @param msg - The frame to send; dropped if the socket isn't open.
     */
    send(msg: Record<string, any>) {
        if (this._ws?.readyState === WebSocket.OPEN) {
            this._ws.send(JSON.stringify(msg));
        }
    }

    /**
     * Handle methods this page doesn't implement. Returning null declines, leaving the caller
     * with the usual unknown-method error.
     *
     * @param fn - The handler, called with the method name and its arguments.
     */
    fallback(fn: (name: string, args: any[]) => MethodResult | Promise<MethodResult> | null) {
        this._fallback = fn;
    }

    /**
     * @param name - The name of the method to register.
     * @param fn - The handler to call when the method is requested.
     */
    method(name: string, fn: Method) {
        if (this._methods.get(name)) {
            error(`Method already exists: ${name}`);
            return;
        }
        this._methods.set(name, fn);
    }

    /**
     * @param name - The name of the method to call.
     * @param args - The arguments to pass to the method.
     * @returns The handler result.
     */
    call(name: string, ...args: any[]): MethodResult | Promise<MethodResult> {
        const fn = this._methods.get(name);
        if (!fn) {
            return (
                this._fallback?.(name, args) ?? {
                    error: `Unknown method: ${name}. The editor may be outdated; reload the page and reconnect.`
                }
            );
        }
        return fn(...args);
    }
}

const mcp = new MCPConnection();

editor.method('mcp:connect', (port?: number, role?: Role) => mcp.connect(port, role));
editor.method('mcp:disconnect', () => mcp.disconnect());
editor.method('mcp:status', () => mcp.status);
editor.method('mcp:port', () => mcp.port);
editor.method('mcp:blocked', () => mcp.blocked);
mcp.on('status', (status: Status) => editor.emit('mcp:status', status));
mcp.on('blocked', (state: string | null) => editor.emit('mcp:blocked', state));

export { mcp, DEFAULT_PORT, PROTOCOL_VERSION };
