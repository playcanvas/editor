import { Events, Observer, ObserverList } from '@playcanvas/observer';

type ObserverSyncArgs = {
    /** The item to sync */
    item: Observer;
    /** Whether the sync is enabled */
    enabled?: boolean;
    /** The prefix for the paths */
    prefix?: any[];
    /** The paths to allow */
    paths?: string[];
};

class ObserverSync extends Events {
    /**
     * @type {Observer}
     */
    item;

    /**
     * @type {boolean}
     * @private
     */
    _enabled;

    /**
     * @type {any[]}
     * @private
     */
    _prefix;

    /**
     * @type {string[]}
     * @private
     */
    _paths;

    constructor(args: ObserverSyncArgs) {
        super();

        this.item = args.item;
        this._enabled = args.enabled || true;
        this._prefix = args.prefix || [];
        this._paths = args.paths || null;

        this._initialize();
    }

    /**
     * @private
     */
    _initialize() {
        // object/array set
        this.item.on('*:set', (path, value, valueOld) => {
            if (!this._enabled) {
                return;
            }

            // if this happens it's a bug
            if (this.item.sync !== this) {
                log.error('Garbage Observer Sync still pointing to item', this.item);
            }

            // check if path is allowed
            if (this._paths) {
                let allowedPath = false;
                for (let i = 0; i < this._paths.length; i++) {
                    if (path.indexOf(this._paths[i]) !== -1) {
                        allowedPath = true;
                        break;
                    }
                }

                // path is not allowed
                if (!allowedPath) {
                    return;
                }
            }

            // full path
            const p = this._prefix.concat(path.split('.'));

            // need jsonify
            if (value instanceof Observer || value instanceof ObserverList) {
                value = value.json();
            }

            // can be array value
            const ind = path.lastIndexOf('.');
            if (ind !== -1 && (this.item.get(path.slice(0, ind)) instanceof Array)) {
                // array index should be int
                p[p.length - 1] = parseInt(p[p.length - 1], 10);

                // emit operation: list item set
                this.emit('op', {
                    p: p,
                    li: value,
                    ld: valueOld
                });
            } else {
                // emit operation: object item set
                const obj = {
                    p: p,
                    oi: value
                };

                if (valueOld !== undefined) {
                    obj.od = valueOld;
                }

                this.emit('op', obj);
            }
        });

        // unset
        this.item.on('*:unset', (path, value) => {
            if (!this._enabled) {
                return;
            }

            this.emit('op', {
                p: this._prefix.concat(path.split('.')),
                od: null
            });
        });

        // list move
        this.item.on('*:move', (path, value, ind, indOld) => {
            if (!this._enabled) {
                return;
            }
            this.emit('op', {
                p: this._prefix.concat(path.split('.')).concat([indOld]),
                lm: ind
            });
        });

        // list remove
        this.item.on('*:remove', (path, value, ind) => {
            if (!this._enabled) {
                return;
            }

            // need jsonify
            if (value instanceof Observer || value instanceof ObserverList) {
                value = value.json();
            }

            this.emit('op', {
                p: this._prefix.concat(path.split('.')).concat([ind]),
                ld: value
            });
        });

        // list insert
        this.item.on('*:insert', (path, value, ind) => {
            if (!this._enabled) {
                return;
            }

            // need jsonify
            if (value instanceof Observer || value instanceof ObserverList) {
                value = value.json();
            }

            this.emit('op', {
                p: this._prefix.concat(path.split('.')).concat([ind]),
                li: value
            });
        });
    }

    /**
     * Write operation to the item based on the sharedb operation
     *
     * @param {object} op - The sharedb operation
     * @param {any[]} op.p - The path of the operation
     * @param {object} op.oi - The inserted object
     * @param {object} op.od - The deleted object
     * @param {object} op.li - The inserted array item
     * @param {object} op.ld - The deleted array item
     * @param {number} op.lm - The moved array item
     */
    write(op) {
        // disable history if available
        let historyReEnable = false;
        if (this.item.history && this.item.history.enabled) {
            historyReEnable = true;
            this.item.history.enabled = false;
        }

        if (op.hasOwnProperty('oi')) {
            // set key value
            const path = op.p.slice(this._prefix.length).join('.');

            this._enabled = false;
            this.item.set(path, op.oi, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('ld') && op.hasOwnProperty('li')) {
            // set array value
            const path = op.p.slice(this._prefix.length).join('.');

            this._enabled = false;
            this.item.set(path, op.li, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('ld')) {
            // delete item
            const path = op.p.slice(this._prefix.length, -1).join('.');
            const ind = op.p[op.p.length - 1];

            this._enabled = false;
            this.item.remove(path, ind, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('li')) {
            // add item
            const path = op.p.slice(this._prefix.length, -1).join('.');
            const ind = op.p[op.p.length - 1];

            this._enabled = false;
            this.item.insert(path, op.li, ind, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('lm')) {
            // item moved
            const path = op.p.slice(this._prefix.length, -1).join('.');
            const indOld = op.p[op.p.length - 1];
            const ind = op.lm;

            this._enabled = false;
            this.item.move(path, indOld, ind, false, true);
            this._enabled = true;


        } else if (op.hasOwnProperty('od')) {
            // unset key value
            const path = op.p.slice(this._prefix.length).join('.');
            this._enabled = false;
            this.item.unset(path, false, true);
            this._enabled = true;


        } else {
            console.log('unknown operation', op);
        }

        // reenable history
        if (historyReEnable) {
            this.item.history.enabled = true;
        }

        this.emit('sync', op);
    }

    set enabled(value) {
        this._enabled = !!value;
    }

    get enabled() {
        return this._enabled;
    }
}

export { ObserverSync };
