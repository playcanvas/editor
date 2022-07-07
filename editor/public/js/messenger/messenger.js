const MESSENGER_RECONNECT_DELAY = 1000;
const MESSENGER_PING_DELAY = 10000;
const MESSENGER_PONG_DELAY = 5000;
const MESSENGER_RESERVED_NAMES = ['connect', 'close', 'error', 'message'];

class Messenger extends Events {
    constructor(args) {
        super(args);

        this._url = '';
        this._reconnectDelay = null;
        this._xhr = null;
        this._connecting = false;
        this._connectAttempts = 0;
        this._connected = false;
        this._authenticated = false;
        this._pingTimeout = null;
        this._pongTimeout = null;

        this.on('welcome', function (msg) {
            this._authenticated = true;
            this._ping();
        });
    }

    get isConnected() {
        return this._connected;
    }

    get isAuthenticated() {
        return this._authenticated;
    }

    connect(url) {
        if (this._connecting) return;

        this._url = url;
        this._connectAttempts++;
        this._connecting = true;
        this._reconnectDelay = null;

        this.socket = new WebSocket(this._url);
        this.socket.onopen = this._onopen.bind(this);
        this.socket.onmessage = this._onmessage.bind(this);
        this.socket.onerror = this._onerror.bind(this);
        this.socket.onclose = this._onclose.bind(this);
    }


    reconnect() {
        if (this._connecting || !this._url) {
            return;
        }

        if (this._connectAttempts >= 8) {
            console.log('messenger cannot reconnect');
            return;
        }

        console.log('messenger reconnecting');

        // clear another potential reconnects
        if (this._reconnectDelay) {
            clearTimeout(this._reconnectDelay);
            this._reconnectDelay = null;
        }

        // start delay
        this._reconnectDelay = setTimeout(function () {
            this.connect(this._url);
        }.bind(this), MESSENGER_RECONNECT_DELAY);
    }


    _onopen() {
        console.log('messenger connected');

        this._connected = true;
        this._connecting = false;
        this._connectAttempts = 0;

        this.emit('connect');
    }


    _onclose() {
        if (!this._connected) return;

        this._connected = false;
        this._authenticated = false;

        this._cancelPing();
        this._cancelPong();

        this.emit('close');

        this.reconnect();
    }


    _onerror(error) {
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
            this._onerror(new Error('could not parse message - is it JSON?'));
            return;
        }

        if (MESSENGER_RESERVED_NAMES.indexOf(msg.name) !== -1) {
            this._onerror(new Error('could not receive message - name is reserved:', msg.name));
            return;
        }

        this.emit('message', msg);
        this.emit(msg.name, msg);
    }

    _ping() {
        this._cancelPing();
        this._cancelPong();

        this._pingTimeout = setTimeout(function () {
            this._pingTimeout = null;
            this.send('ping');
            this._waitPong();
        }.bind(this), MESSENGER_PING_DELAY);
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
        this._pongTimeout = setTimeout(function () {
            this._pongTimeout = null;
            // no pong received so reconnect
            this.close();
        }.bind(this), MESSENGER_PONG_DELAY);
    }

    _onPong() {
        this._cancelPong();
        this._ping();
    }

    authenticate(accessToken, type) {
        if (!this._connected) return;

        this.send({
            name: 'authenticate',
            token: accessToken,
            type: type
        });
    }

    send(msg) {
        if (!this._connected) return;

        if (MESSENGER_RESERVED_NAMES.indexOf(msg.name) !== -1) {
            this._onerror(new Error('could not send message - name is reserved:', msg.name));
            return;
        }
        this.socket.send(JSON.stringify(msg));
    }


    close(args) {
        if (!this._connected) return;

        args = args || { };
        args.code = args.code || 1000; // 1000 - CLOSE_NORMAL
        args.reason = args.reason || 'unknown';

        this.socket.close(args.code, args.reason);

        if (this._connected) {
            // call _onclose to clear up our current state in case
            // _onclose is not fired immediately
            this._onclose();
        }
    }


    // start watching project
    projectWatch(id) {
        this.send({
            name: 'project.watch',
            target: {
                type: 'general'
            },
            env: ['*'],
            data: { id: id }
        });
    }

    // stop watching project
    projectUnwatch(id) {
        this.send({
            name: 'project.unwatch',
            target: {
                type: 'general'
            },
            env: ['*'],
            data: { id: id }
        });
    }

    // start watching organization
    organizationWatch(id) {
        this.send({
            name: 'organization.watch',
            target: {
                type: 'general'
            },
            env: ['*'],
            data: { id: id }
        });
    }

    // stop watching organization
    organizationUnwatch(id) {
        this.send({
            name: 'organization.unwatch',
            target: {
                type: 'general'
            },
            env: ['*'],
            data: { id: id }
        });
    }
}

window.Messenger = Messenger;
