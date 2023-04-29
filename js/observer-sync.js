import { Events, Observer, ObserverList } from '@playcanvas/observer';

function ObserverSync(args) {
    window.assignEvents(this);
    args = args || { };

    this.item = args.item;
    this._enabled = args.enabled || true;
    this._prefix = args.prefix || [];
    this._paths = args.paths || null;
    this._sync = args.sync || true;

    this._initialize();
}
ObserverSync.prototype = Object.create(Events.prototype);


ObserverSync.prototype._initialize = function () {
    var self = this;
    var item = this.item;

    // object/array set
    item.on('*:set', function (path, value, valueOld) {
        if (!self._enabled) return;

        // if this happens it's a bug
        if (item.sync !== self) {
            log.error('Garbage Observer Sync still pointing to item', item);
        }

        // check if path is allowed
        if (self._paths) {
            var allowedPath = false;
            for (var i = 0; i < self._paths.length; i++) {
                if (path.indexOf(self._paths[i]) !== -1) {
                    allowedPath = true;
                    break;
                }
            }

            // path is not allowed
            if (!allowedPath)
                return;
        }

        // full path
        var p = self._prefix.concat(path.split('.'));

        // need jsonify
        if (value instanceof Observer || value instanceof ObserverList)
            value = value.json();

        // can be array value
        var ind = path.lastIndexOf('.');
        if (ind !== -1 && (this.get(path.slice(0, ind)) instanceof Array)) {
            // array index should be int
            p[p.length - 1] = parseInt(p[p.length - 1], 10);

            // emit operation: list item set
            self.emit('op', {
                p: p,
                li: value,
                ld: valueOld
            });
        } else {
            // emit operation: object item set
            var obj = {
                p: p,
                oi: value
            };

            if (valueOld !== undefined) {
                obj.od = valueOld;
            }

            self.emit('op', obj);
        }
    });

    // unset
    item.on('*:unset', function (path, value) {
        if (!self._enabled) return;

        self.emit('op', {
            p: self._prefix.concat(path.split('.')),
            od: null
        });
    });

    // list move
    item.on('*:move', function (path, value, ind, indOld) {
        if (!self._enabled) return;
        self.emit('op', {
            p: self._prefix.concat(path.split('.')).concat([indOld]),
            lm: ind
        });
    });

    // list remove
    item.on('*:remove', function (path, value, ind) {
        if (!self._enabled) return;

        // need jsonify
        if (value instanceof Observer || value instanceof ObserverList)
            value = value.json();

        self.emit('op', {
            p: self._prefix.concat(path.split('.')).concat([ind]),
            ld: value
        });
    });

    // list insert
    item.on('*:insert', function (path, value, ind) {
        if (!self._enabled) return;

        // need jsonify
        if (value instanceof Observer || value instanceof ObserverList)
            value = value.json();

        self.emit('op', {
            p: self._prefix.concat(path.split('.')).concat([ind]),
            li: value
        });
    });
};


ObserverSync.prototype.write = function (op) {
    // disable history if available
    var historyReEnable = false;
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

        this._enabled = false;
        this.item.remove(path, op.p[op.p.length - 1], false, true);
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
        var indOld = op.p[op.p.length - 1];
        var ind = op.lm;

        this._enabled = false;
        this.item.move(path, indOld, ind, false, true);
        this._enabled = true;


    } else if (op.hasOwnProperty('od')) {
        // unset key value
        var path = op.p.slice(this._prefix.length).join('.');
        this._enabled = false;
        this.item.unset(path, false, true);
        this._enabled = true;


    } else {
        console.log('unknown operation', op);
    }

    // reenable history
    if (historyReEnable)
        this.item.history.enabled = true;

    this.emit('sync', op);
};

Object.defineProperty(ObserverSync.prototype, 'enabled', {
    get: function () {
        return this._enabled;
    },
    set: function (value) {
        this._enabled = !!value;
    }
});

Object.defineProperty(ObserverSync.prototype, 'prefix', {
    get: function () {
        return this._prefix;
    },
    set: function (value) {
        this._prefix = value || [];
    }
});

Object.defineProperty(ObserverSync.prototype, 'paths', {
    get: function () {
        return this._paths;
    },
    set: function (value) {
        this._paths = value || null;
    }
});

window.ObserverSync = ObserverSync;
