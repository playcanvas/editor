class WorkerServer {
    /**
     * @type {(ArrayBuffer | MessagePort | ImageBitmap)[]}
     */
    _transfer = [];

    /**
     * @type {Map<string, Function[]>}
     */
    _callbacks = new Map();

    /**
     * @type {DedicatedWorkerGlobalScope}
     */
    worker;

    constructor(worker) {
        this.worker = worker;
        this.worker.onmessage = this._onMessage.bind(this);
        this.worker.onerror = this._onError.bind(this);

        this.send('ready');
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
        for (const callback of this._callbacks.get(type)) {
            callback(...args);
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
     * Stops the worker.
     */
    stop() {
        this.worker.close();
    }

    /**
     * Reset the worker.
     */
    reset() {
        this._transfer = [];
        this._callbacks.clear();
    }

    /**
     * Send a message to the worker.
     *
     * @param {string} type - The type of the message.
     * @param {...any} args - The arguments of the message.
     */
    send(type, ...args) {
        this.worker.postMessage({ type, data: args }, this._transfer);
        this._transfer = [];
    }

    /**
     * Add transferable objects to the worker.
     *
     * @param {(ArrayBuffer | MessagePort | ImageBitmap)[]} transfer - The transferable objects.
     * @returns {WorkerServer} - The instance of the worker client.
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

export { WorkerServer };
