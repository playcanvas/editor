import { Events } from '@playcanvas/observer';

const DEFAULT_PORT = 52000;
const RETRY_TIMEOUT = 1000;

type Status = 'connecting' | 'connected' | 'disconnected';
type Method = (...args: any[]) => { data?: any; error?: string } | Promise<{ data?: any; error?: string }>;

const log = (msg: string) => console.log(`%c[MCP] ${msg}`, 'color:#f60');
const error = (msg: unknown) => console.error(`%c[MCP] ${msg}`, 'color:#f60');

/**
 * WebSocket client that connects the editor to the external MCP server and dispatches its
 * tool requests to registered handlers. Same wire protocol as the former Chrome extension:
 * `{ id, name, args }` in, `{ id, res }` out.
 */
class MCPConnection extends Events {
    private _ws: WebSocket | null = null;

    private _methods = new Map<string, Method>();

    private _connectTimeout: ReturnType<typeof setTimeout> | null = null;

    private _status: Status = 'disconnected';

    get status() {
        return this._status;
    }

    private _setStatus(status: Status) {
        this._status = status;
        this.emit('status', status);
    }

    /**
     * @param port - The MCP server port to connect to.
     */
    connect(port: number = DEFAULT_PORT) {
        const address = `ws://localhost:${port}`;
        this._setStatus('connecting');
        log(`Connecting to ${address}`);

        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
        }

        this._connect(address, () => {
            this._ws!.onclose = (evt) => {
                if (evt.reason === 'FORCE') {
                    return;
                }
                this._setStatus('disconnected');
                log('Disconnected');
            };
            this._setStatus('connected');
            log('Connected');
        });
    }

    /**
     * @param address - The WebSocket address to connect to.
     * @param resolve - Called once the connection is established.
     */
    private _connect(address: string, resolve: () => void) {
        this._ws = new WebSocket(address);
        this._ws.onopen = () => resolve();
        this._ws.onmessage = async (event) => {
            try {
                const { id, name, args } = JSON.parse(event.data);
                const res = await this.call(name, ...args);
                this._ws?.send(JSON.stringify({ id, res }));
            } catch (e) {
                error(e);
            }
        };
        this._ws.onclose = () => {
            this._connectTimeout = setTimeout(() => {
                this._connectTimeout = null;
                this._connect(address, resolve);
            }, RETRY_TIMEOUT);
        };
    }

    disconnect() {
        if (this._connectTimeout) {
            clearTimeout(this._connectTimeout);
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
    call(name: string, ...args: any[]) {
        return this._methods.get(name)?.(...args);
    }
}

const mcp = new MCPConnection();

editor.method('mcp:connect', (port?: number) => mcp.connect(port));
editor.method('mcp:disconnect', () => mcp.disconnect());
editor.method('mcp:status', () => mcp.status);
mcp.on('status', (status: Status) => editor.emit('mcp:status', status));

export { mcp, DEFAULT_PORT };
