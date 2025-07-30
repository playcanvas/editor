class Defer {
    /**
     * @type {Promise}
     */
    promise;

    /**
     * @type {Function}
     */
    resolve;

    /**
     * @type {Function}
     */
    reject;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}

export { Defer };
