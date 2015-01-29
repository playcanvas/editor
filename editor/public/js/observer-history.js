function ObserverHistory(args) {
    Events.call(this);
    args = args || { };

    this.item = args.item;
    this._enabled = args.enabled || true;
    this._combine = args._combine || false;

    this._initialize();
}
ObserverHistory.prototype = Object.create(Events.prototype);


ObserverHistory.prototype._initialize = function() {
    var self = this;

    this.item.on('*:set', function(path, value, valueOld) {
        if (! self._enabled) return;

        self.emit('add', {
            name: path,
            combine: self._combine,
            undo: function() {
                self._enabled = false;
                self.item.set(path, valueOld);
                self._enabled = true;
            },
            redo: function() {
                self._enabled = false;
                self.item.set(path, value);
                self._enabled = true;
            }
        });
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


Object.defineProperty(ObserverHistory.prototype, 'combine', {
    get: function() {
        return this._combine;
    },
    set: function(value) {
        this._combine = !! value;
    }
});
