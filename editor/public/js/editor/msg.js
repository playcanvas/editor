function Messenger() {
    Events.call(this);

    this._hooks = { };
}
Messenger.prototype = Object.create(Events.prototype);

Messenger.prototype.hook = function(name, fn) {
    this._hooks[name] = fn;
};

Messenger.prototype.unhook = function(name) {
    delete this._hooks[name];
};

Messenger.prototype.call = function(name) {
    if (this._hooks[name]) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this._hooks[name].apply(null, args);
    } else {
        return null;
    }
};


var msg = new Messenger();
