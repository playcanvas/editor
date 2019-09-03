function ObserverHistory(args) {
    Events.call(this);
    args = args || {};

    this.item = args.item;
    this._history = args.history;
    this._enabled = args.enabled || true;
    this._prefix = args.prefix || '';
    this._combine = args.combine || false;

    this._events = [];

    this._initialize();
}
ObserverHistory.prototype = Object.create(Events.prototype);


ObserverHistory.prototype._initialize = function () {
    var self = this;

    this._events.push(this.item.on('*:set', function (path, value, valueOld) {
        if (!self._enabled || !self._history) return;

        // need jsonify
        if (value instanceof Observer)
            value = value.json();

        // action
        var action = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;

                if (valueOld === undefined) {
                    item.unset(path);
                } else {
                    item.set(path, valueOld);
                }

                item.history.enabled = true;
            },
            redo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;

                if (value === undefined) {
                    item.unset(path);
                } else {
                    item.set(path, value);
                }

                item.history.enabled = true;
            }
        };

        self._history.add(action);
    }));

    this._events.push(this.item.on('*:unset', function (path, valueOld) {
        if (!self._enabled || !self._history) return;

        // action
        var action = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.set(path, valueOld);
                item.history.enabled = true;
            },
            redo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.unset(path);
                item.history.enabled = true;
            }
        };

        self._history.add(action);
    }));

    this._events.push(this.item.on('*:insert', function (path, value, ind) {
        if (!self._enabled || !self._history) return;

        // need jsonify
        // if (value instanceof Observer)
        //     value = value.json();

        // action
        var action = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.removeValue(path, value);
                item.history.enabled = true;
            },
            redo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.insert(path, value, ind);
                item.history.enabled = true;
            }
        };

        self._history.add(action);
    }));

    this._events.push(this.item.on('*:remove', function (path, value, ind) {
        if (!self._enabled || !self._history) return;

        // need jsonify
        // if (value instanceof Observer)
        //     value = value.json();

        // action
        var action = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.insert(path, value, ind);
                item.history.enabled = true;
            },
            redo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.removeValue(path, value);
                item.history.enabled = true;
            }
        };

        self._history.add(action);
    }));

    this._events.push(this.item.on('*:move', function (path, value, ind, indOld) {
        if (!self._enabled || !self._history) return;

        // action
        var action = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.move(path, ind, indOld);
                item.history.enabled = true;
            },
            redo: function () {
                var item = self.item.latest();
                if (!item) return;

                item.history.enabled = false;
                item.move(path, indOld, ind);
                item.history.enabled = true;
            }
        };

        self._history.add(action);
    }));
};

ObserverHistory.prototype.destroy = function () {
    this._events.forEach(function (evt) {
        evt.unbind();
    });

    this._events.length = 0;
    this.item = null;
};

Object.defineProperty(ObserverHistory.prototype, 'enabled', {
    get: function () {
        return this._enabled;
    },
    set: function (value) {
        this._enabled = !!value;
    }
});


Object.defineProperty(ObserverHistory.prototype, 'prefix', {
    get: function () {
        return this._prefix;
    },
    set: function (value) {
        this._prefix = value || '';
    }
});

Object.defineProperty(ObserverHistory.prototype, 'combine', {
    get: function () {
        return this._combine;
    },
    set: function (value) {
        this._combine = !! value;
    }
});
