import { Events } from '@playcanvas/observer';

import { handleRequest } from './request';

const DEFAULT_PORT = 52000;
const RETRY_TIMEOUT = 1000;
const PROTOCOL_VERSION = 1;

type Status = 'connecting' | 'connected' | 'disconnected';
type Role = 'editor' | 'runtime';
type MethodResult = { data?: any; error?: string; meta?: Record<string, any> };
type Method = (...args: any[]) => MethodResult | Promise<MethodResult>;

const log = (msg: string) => console.log(`[MCP] ${msg}`);
const error = (msg: unknown) => console.error(`[MCP] ${msg}`);

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

    get status() {
        return this._status;
    }

    get port() {
        return this._port;
    }

    private _setStatus(status: Status) {
        this._status = status;
        this.emit('status', status);
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
        log(`Connecting to ws://localhost:${port}`);

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
        const ws = new WebSocket(`ws://localhost:${this._port}`);
        this._ws = ws;

        ws.onopen = () => {
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
            // a deliberate disconnect() (FORCE) must never reconnect
            if (this._forceClosed || evt?.reason === 'FORCE') {
                return;
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
            return { error: `Unknown method: ${name}. The editor may be outdated; reload the page and reconnect.` };
        }
        return fn(...args);
    }
}

const mcp = new MCPConnection();

editor.method('mcp:connect', (port?: number, role?: Role) => mcp.connect(port, role));
editor.method('mcp:disconnect', () => mcp.disconnect());
editor.method('mcp:status', () => mcp.status);
editor.method('mcp:port', () => mcp.port);
mcp.on('status', (status: Status) => editor.emit('mcp:status', status));

export { mcp, DEFAULT_PORT, PROTOCOL_VERSION };
