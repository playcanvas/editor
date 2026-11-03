describe('api.globals.transport tests', function () {
    let clock;
    let sockets;
    let fetches;

    // a socket the realtime connection can drive: listeners, send and close
    class FakeSocket extends EventTarget {
        constructor(url) {
            super();
            this.url = url;
            this.readyState = 0;
            this.sent = [];
            this.onmessage = null;
        }

        send(data) {
            this.sent.push(data);
        }

        close() {
            this.readyState = 3;
            this.dispatchEvent(new Event('close'));
        }

        open() {
            this.readyState = 1;
            this.dispatchEvent(new Event('open'));
        }
    }

    beforeEach(function () {
        sockets = [];
        fetches = [];
        api.globals.transport = {
            fetch: (input) => {
                fetches.push(String(input));
                return Promise.resolve(new Response(JSON.stringify({ id: 7, name: 'a' })));
            },
            xhr: () => new XMLHttpRequest(),
            socket: (url) => {
                const socket = new FakeSocket(url);
                sockets.push(socket);
                return socket;
            }
        };
        api.globals.accessToken = 'token';
        clock = sinon.useFakeTimers();
    });

    afterEach(function () {
        clock.restore();
        api.globals.transport = api.nativeTransport;
        api.globals.accessToken = undefined;
        api.globals.branchId = undefined;
    });

    it('defaults to the native transport', function () {
        expect(api.nativeTransport.xhr()).to.be.instanceOf(XMLHttpRequest);
    });

    it('loads assets through the transport', async function () {
        api.globals.branchId = 'b';
        const asset = new api.Asset({ id: 7 });
        await asset.load();
        expect(fetches).to.deep.equal(['/api/assets/7?branchId=b']);
    });

    it('opens, authenticates and reconnects realtime through the transport', function () {
        const realtime = new api.Realtime();
        const events = [];
        ['connecting', 'connected', 'disconnect', 'nextAttempt'].forEach((name) => {
            realtime.on(name, () => events.push(name));
        });

        realtime.connection.connect('wss://realtime');
        sockets[0].open();
        expect(sockets[0].sent).to.deep.equal(['auth{"accessToken":"token"}']);
        expect(realtime.connection.connected).to.equal(true);

        sockets[0].close();
        expect(realtime.connection.connected).to.equal(false);

        // the reconnect interval elapses, then a new socket comes from the same transport
        clock.tick(3000);
        expect(sockets.map((s) => s.url)).to.deep.equal(['wss://realtime', 'wss://realtime']);
        expect(events).to.deep.equal(['connecting', 'connected', 'disconnect', 'nextAttempt', 'connecting']);

        realtime.connection.disconnect();
    });

    it('rejects an op too large for the server instead of sending it', function () {
        const realtime = new api.Realtime();
        realtime.connection.connect('wss://realtime');
        const socket = sockets[0];
        socket.open();
        socket.dispatchEvent(new MessageEvent('message', { data: 'auth{}' }));

        const sharedb = realtime.connection.sharedb;
        const handled = sinon.stub(sharedb, 'handleMessage');
        const op = (size) => JSON.stringify({
            a: 'op',
            c: 'scenes',
            d: '1',
            v: 3,
            src: 'client',
            seq: 7,
            op: [{ p: ['name'], oi: 'x'.repeat(size) }]
        });
        const sent = socket.sent.length;

        socket.send(op(10));
        socket.send(`selection:${'x'.repeat(2000000)}`);
        socket.send(op(1100000));
        clock.tick(0);

        // the small op and the non-op message go out; the oversized op does not
        expect(socket.sent.length).to.equal(sent + 2);
        expect(handled.calledOnce).to.equal(true);
        const reply = handled.firstCall.args[0];
        expect(reply).to.include({ a: 'op', c: 'scenes', d: '1', v: 3, src: 'client', seq: 7 });
        expect(reply.error.code).to.equal('ERR_OP_TOO_LARGE');

        realtime.connection.disconnect();
    });
});
