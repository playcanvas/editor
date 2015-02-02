function ObserverHistory(args) {
    Events.call(this);
    args = args || { };

    this.item = args.item;
    this._enabled = args.enabled || true;
    this._combine = args._combine || false;
    this._prefix = args.prefix || '';

    this._initialize();
}
ObserverHistory.prototype = Object.create(Events.prototype);


ObserverHistory.prototype._initialize = function() {
    var self = this;

    this.item.on('*:set', function(path, value, valueOld) {
        if (! self._enabled) return;

        // action
        var data = {
            name: self._prefix + path,
            combine: self._combine,
            undo: function() {
                self._enabled = false;
                console.log(path, valueOld);
                self.item.set(path, valueOld);
                self._enabled = true;
            },
            redo: function() {
                self._enabled = false;
                console.log(path, value);
                self.item.set(path, value);
                self._enabled = true;
            }
        };

        if (data.combine && editor.call('history:canUndo') && editor.call('history:current').name === data.name) {
            // update
            self.emit('record', 'update', data);
        } else {
            // add
            self.emit('record', 'add', data);
        }
    });

    this.item.on('*:insert', function(path, value, ind) {

    });

    this.item.on('*:remove', function(path, value, ind) {

    });

    this.item.on('*:move', function(path, value, ind, indOld) {

    });
};


Object.defineProperty(ObserverHistory.prototype, 'enabled', {
    get: function() {
        return this._enabled;
    },
    set: function(value) {
        this._enabled = !! value;
    }
});


Object.defineProperty(ObserverHistory.prototype, 'prefix', {
    get: function() {
        return this._prefix;
    },
    set: function(value) {
        this._prefix = value || '';
    }
});


Object.defineProperty(ObserverHistory.prototype, 'combine', {
    get: function() {
        return this._combine;
    },
    set: function(value) {
        this._combine = !! value;
    }
});
