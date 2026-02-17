class WorkerServer {
    _transfer: (ArrayBuffer | MessagePort | ImageBitmap)[] = [];

    _callbacks: Map<string, Function[]> = new Map();

    worker: globalThis.DedicatedWorkerGlobalScope;

    constructor(worker: globalThis.DedicatedWorkerGlobalScope) {
        this.worker = worker;
        this.worker.onmessage = this._onMessage.bind(this);
        this.worker.onerror = this._onError.bind(this);

        this.send('ready');
    }


    /**
     * @param type - The type of the message.
     * @param args - The arguments of the message.
     */
    private _fireCallback(type: string, ...args: any[]) {
        if (!this._callbacks.has(type)) {
            return;
        }
        for (const callback of this._callbacks.get(type)) {
            callback(...args);
        }
    }

    /**
     * @param event - The message event.
     */
    private _onMessage(event: MessageEvent) {
        const { type, data } = event.data;
        this._fireCallback(type, ...data);
    }

    /**
     * @param event - The error event.
     */
    private _onError(event: ErrorEvent) {
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
     * @param type - The type of the message.
     * @param args - The arguments of the message.
     */
    send(type: string, ...args: any[]) {
        this.worker.postMessage({ type, data: args }, this._transfer);
        this._transfer = [];
    }

    /**
     * Add transferable objects to the worker.
     *
     * @param transfer - The transferable objects.
     * @returns The instance of the worker client.
     */
    with(transfer: (ArrayBuffer | MessagePort | ImageBitmap)[]): WorkerServer {
        if (!this.worker) {
            return this;
        }
        this._transfer.push(...transfer);
        return this;
    }

    /**
     * Add a callback to the worker.
     *
     * @param type - The type of the message.
     * @param callback - The callback function.
     */
    on(type: string, callback: Function) {
        if (!this._callbacks.has(type)) {
            this._callbacks.set(type, []);
        }
        this._callbacks.get(type).push(callback);
    }

    /**
     * Add a callback to the worker that will only be called once.
     *
     * @param type - The type of the message.
     * @param callback - The callback function.
     */
    once(type: string, callback: Function) {
        const onceCallback = (...args: unknown[]) => {
            this.off(type, onceCallback);
            callback(...args);
        };
        this.on(type, onceCallback);
    }

    /**
     * Remove a callback from the worker.
     *
     * @param type - The type of the message.
     * @param callback - The callback function.
     */
    off(type: string, callback: Function) {
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
