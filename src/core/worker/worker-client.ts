class WorkerClient {
    /**
     * @type {(ArrayBuffer | MessagePort | ImageBitmap)[]}
     */
    _transfer = [];

    /**
     * @type {Map<string, Function[]>}
     */
    _callbacks = new Map();

    /**
     * @type {string}
     */
    url;

    /**
     * @type {Worker | null}
     */
    worker;

    /**
     * @param {string} url - The URL of the worker.
     */
    constructor(url) {
        this.url = url;
    }

    /**
     * @param {string} type - The type of the message.
     * @param {...any} args - The arguments of the message.
     * @private
     */
    _fireCallback(type, ...args) {
        if (!this._callbacks.has(type)) {
            return;
        }
        const callbacks = this._callbacks.get(type).slice();
        for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](...args);
        }
    }

    /**
     * @param {MessageEvent} event - The message event.
     * @private
     */
    _onMessage(event) {
        const { type, data } = event.data;
        this._fireCallback(type, ...data);
    }

    /**
     * @param {ErrorEvent} event - The error event.
     * @private
     */
    _onError(event) {
        this._fireCallback('error', event.message);
    }

    /**
     * Start the worker.
     */
    async start() {
        if (new URL(this.url, location.href).hostname === location.hostname) {
            this.worker = new Worker(this.url);
        } else {
            const res = await fetch(this.url);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            this.worker = new Worker(url);
            URL.revokeObjectURL(url);
        }
        this.worker.onmessage = this._onMessage.bind(this);
        this.worker.onerror = this._onError.bind(this);
    }

    /**
     * Stop the worker.
     */
    stop() {
        this.worker?.terminate();
        this.worker = null;
    }

    /**
     * Send a message to the worker.
     *
     * @param {string} type - The type of the message.
     * @param {...any} args - The arguments of the message.
     */
    send(type, ...args) {
        if (!this.worker) {
            return;
        }
        this.worker.postMessage({ type, data: args }, this._transfer);
        this._transfer = [];
    }

    /**
     * Add transferable objects to the worker.
     *
     * @param {(ArrayBuffer | MessagePort | ImageBitmap)[]} transfer - The transferable objects.
     * @returns {WorkerClient} - The instance of the worker client.
     */
    with(transfer) {
        if (!this.worker) {
            return this;
        }
        this._transfer.push(...transfer);
        return this;
    }

    /**
     * Add a callback to the worker.
     *
     * @param {string} type - The type of the message.
     * @param {Function} callback - The callback function.
     */
    on(type, callback) {
        if (!this._callbacks.has(type)) {
            this._callbacks.set(type, []);
        }
        this._callbacks.get(type).push(callback);
    }

    /**
     * Add a callback to the worker that will only be called once.
     *
     * @param {string} type - The type of the message.
     * @param {Function} callback - The callback function.
     */
    once(type, callback) {
        const onceCallback = (...args) => {
            this.off(type, onceCallback);
            callback(...args);
        };
        this.on(type, onceCallback);
    }

    /**
     * Remove a callback from the worker.
     *
     * @param {string} type - The type of the message.
     * @param {Function} callback - The callback function.
     */
    off(type, callback) {
        if (!this._callbacks.has(type)) {
            return;
        }
        const callbacks = this._callbacks.get(type);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }
}

export { WorkerClient };
