import { Events } from '@playcanvas/observer';

const RELAY_RECONNECT_DELAY = 1000;
const RELAY_PING_DELAY = 10000;
const RELAY_PONG_DELAY = 5000;

/** Disconnection arguments for closing the WebSocket connection */
interface CloseArgs {
    /** The disconnection code. Defaults to 1000. */
    code?: number;
    /** The reason for the disconnection. Defaults to 'unknown'. */
    reason?: string;
}

/** Authentication options when joining a room */
interface RoomAuthentication {
    /** The authentication type. Currently only 'project' is supported. */
    type: string;
    /** If authentication.type is 'project' then this would be the project id. */
    id: number | string;
}

/**
 * Relay server client library
 */
class RelayServer extends Events {
    private _url: string;

    private _reconnectDelay: ReturnType<typeof setTimeout> | null;

    private _connecting: boolean;

    private _connectAttempts: number;

    private _connected: boolean;

    private _pingTimeout: ReturnType<typeof setTimeout> | null;

    private _pongTimeout: ReturnType<typeof setTimeout> | null;

    private _rooms: Record<string, Set<number>>;

    private _userId: number | null;

    private socket: WebSocket;

    constructor() {
        super();
        this._url = '';
        this._reconnectDelay = null;
        this._connecting = false;
        this._connectAttempts = 0;
        this._connected = false;
        this._pingTimeout = null;
        this._pongTimeout = null;
        this._rooms = {};
        this._userId = null;

        this.on('welcome', (data) => {
            this._userId = data.userId;
            this._ping();
        });

        // If the users connection is restored, reconnect immediately
        window.addEventListener('online', () => {
            this._connectAttempts = 0;
            this.reconnect();
        });
    }

    /**
     * Connects to the relay server
     *
     * @param url - The server URL
     */
    connect(url: string) {
        if (this._connected || this._connecting) {
            return;
        }

        this._url = url;
        this._connectAttempts++;
        this._connecting = true;
        this._reconnectDelay = null;

        this.socket = new WebSocket(this._url);
        this.socket.onopen = this._onopen.bind(this);
        this.socket.onmessage = this._onmessage.bind(this);
        this.socket.onerror = () => {
            const state = this._connected ? 'connected' : this._connecting ? 'connecting' : 'disconnected';
            this._onerror(new Error(`WebSocket error (state: ${state}, url: ${this._url}, attempts: ${this._connectAttempts})`));
        };
        this.socket.onclose = this._onclose.bind(this);
    }

    /**
     * Reconnects to the server
     */
    reconnect() {
        if (this._connected || this._connecting || !this._url) {
            return;
        }

        if (this._connectAttempts >= 8) {
            console.log('relay server cannot reconnect');
            return;
        }

        console.log('relay server reconnecting');

        // clear another potential reconnects
        if (this._reconnectDelay) {
            clearTimeout(this._reconnectDelay);
            this._reconnectDelay = null;
        }

        // start delay
        this._reconnectDelay = setTimeout(() => {
            this.connect(this._url);
        }, RELAY_RECONNECT_DELAY * (this._connectAttempts + 1));
    }

    /**
     * Whether we are connected to the server
     */
    get isConnected() {
        return this._connected;
    }

    _onopen() {
        console.log('relay server connected');

        this._connected = true;
        this._connecting = false;
        this._connectAttempts = 0;

        this.emit('connect');
    }

    _onclose() {
        this._connected = false;

        this._cancelPing();
        this._cancelPong();

        // emit room:leave events for all users in rooms
        for (const name in this._rooms) {
            this._rooms[name].forEach((id) => {
                this._emitRoomLeave(name, id);
            });
        }
        this._rooms = {};

        this.emit('disconnect');

        this.reconnect();
    }

    _onerror(error: Error) {
        this._connecting = false;
        console.error(error);
        this.emit('error', error);
    }

    _onmessage(raw) {
        if (raw.data === 'pong') {
            this._onPong();
            return;
        }

        let msg;
        try {
            msg = JSON.parse(raw.data);
        } catch (ex) {
            const preview = String(raw?.data ?? '').slice(0, 100);
            this._onerror(new Error(`Failed to parse relay message: ${ex.message} (preview: ${preview})`));
            return;
        }

        if (msg.error) {
            this.emit('error', msg.error);
        } else {

            // keep track of rooms and connected users
            if (msg.t === 'room:join') {
                this._handleRoomJoin(msg);
            } else if (msg.t === 'room:leave') {
                this._handleRoomLeave(msg);
            }

            this.emit('message', msg);
            this.emit(msg.t, msg);
        }
    }

    _handleRoomJoin(msg) {
        if (msg.users) {
            this._rooms[msg.name] = new Set(msg.users);
        } else if (msg.userId) {
            if (!this._rooms[msg.name]) {
                this._rooms[msg.name] = new Set();
            }
            this._rooms[msg.name].add(msg.userId);
        }
    }

    _handleRoomLeave(msg) {
        if (this._rooms[msg.name]) {
            if (msg.userId === this._userId) {
                // emit room leave for all the other users
                this._rooms[msg.name].forEach((id) => {
                    if (id !== this._userId) {
                        this._rooms[msg.name].delete(id);
                        this._emitRoomLeave(msg.name, id);
                    }
                });
            }

            this._rooms[msg.name].delete(msg.userId);
            if (!this._rooms[msg.name].size) {
                delete this._rooms[msg.name];
            }
        }
    }

    _emitRoomLeave(name, userId) {
        const msg = {
            t: 'room:leave',
            name: name,
            userId: userId
        };

        this.emit('message', msg);
        this.emit(msg.t, msg);
    }

    _ping() {
        this._cancelPing();
        this._cancelPong();

        this._pingTimeout = setTimeout(() => {
            this._pingTimeout = null;
            this.send('ping');
            this._waitPong();
        }, RELAY_PING_DELAY);
    }

    _cancelPing() {
        if (this._pingTimeout) {
            clearTimeout(this._pingTimeout);
            this._pingTimeout = null;
        }
    }

    _cancelPong() {
        if (this._pongTimeout) {
            clearTimeout(this._pongTimeout);
            this._pongTimeout = null;
        }
    }

    _waitPong() {
        this._cancelPong();

        // wait for server to send pong message
        this._pongTimeout = setTimeout(() => {
            this._pongTimeout = null;
            // no pong received so reconnect
            this.close();
        }, RELAY_PONG_DELAY);
    }

    _onPong() {
        this._cancelPong();
        this._ping();
    }

    /**
     * Sends a message to the server
     *
     * @param msg - The message data
     */
    send(msg: string | object) {
        if (!this._connected) {
            return;
        }

        this.socket.send(JSON.stringify(msg));
    }

    /**
     * Disconnects from the server
     *
     * @param args - The disconnection arguments.
     */
    close(args?: CloseArgs) {
        if (!this._connected) {
            return;
        }

        const opts = args || {};
        const code = opts.code ?? 1000; // 1000 - CLOSE_NORMAL
        const reason = opts.reason ?? 'unknown';

        this.socket.close(code, reason);

        if (this._connected) {
            // call _onclose to clear up our current state in case
            // _onclose is not fired immediately
            this._onclose();
        }
    }

    /**
     * Joins a room. If the room does not exist
     * it will be created first.
     *
     * @param name - The room name. Must be globally unique.
     * @param authentication - The authentication handling of the room.
     */
    joinRoom(name: string, authentication: RoomAuthentication) {
        this.send({
            t: 'room:join',
            name: name,
            authentication: authentication
        });
    }

    /**
     * Leaves a room.
     *
     * @param name - The room name
     */
    leaveRoom(name: string) {
        this.send({
            t: 'room:leave',
            name: name
        });
    }

    /**
     * Sends a message to all the users in the room.
     *
     * @param roomName - The name
     * @param msg - The message to send
     */
    broadcast(roomName: string, msg: object) {
        this.send({
            t: 'room:msg',
            msg: msg,
            name: roomName

        });
    }

    /**
     * Sends a direct message to a specific user in the room.
     *
     * @param roomName - The room name
     * @param msg - The message to send
     * @param recipientId - The recipient's user id
     */
    dm(roomName: string, msg: object, recipientId: number) {
        this.send({
            t: 'room:msg',
            msg: msg,
            name: roomName,
            to: recipientId
        });
    }
}

export { RelayServer };
