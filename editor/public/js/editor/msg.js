function Editor() {
    Events.call(this);

    this._hooks = { };
}
Editor.prototype = Object.create(Events.prototype);

Editor.prototype.hook = function(name, fn) {
    this._hooks[name] = fn;
};

Editor.prototype.unhook = function(name) {
    delete this._hooks[name];
};

Editor.prototype.call = function(name) {
    if (this._hooks[name]) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this._hooks[name].apply(null, args);
    } else {
        return null;
    }
};


var msg = new Editor();
