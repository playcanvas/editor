"use strict";

function Events() {
    // _world
    Object.defineProperty(
        this,
        '_events', {
            enumerable: false,
            configurable: false,
            writable: true,
            value: { }
        }
    );
}

Events.prototype.on = function(name, fn) {
    var events = this._events[name];
    if (events === undefined) {
        this._events[name] = [ fn ];
    } else {
        if (events.indexOf(fn) == -1)
            events.push(fn);
    }
    return new EventHandle(this, name, fn);
};

Events.prototype.once = function(name, fn) {
    var self = this;
    var evt = this.on(name, function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        fn.call(self, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        evt.unbind();
    });
    return evt;
};

Events.prototype.emit = function(name, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    var events = this._events[name];
    if (! events)
        return this;

    events = events.slice(0);

    for(var i = 0; i < events.length; i++) {
        if (! events[i])
            continue;

        try {
            events[i].call(this, arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        } catch(ex) {
            console.info('%c%s %c(event error)', 'color: #06f', name, 'color: #f00');
            console.log(ex.stack);
        }
    }

    return this;
};

Events.prototype.unbind = function(name, fn) {
    if (name) {
        var events = this._events[name];
        if (! events)
            return this;

        if (fn) {
            var i = events.indexOf(fn);
            if (i !== -1) {
                if (events.length === 1) {
                    delete this._events[name];
                } else {
                    events.splice(i, 1);
                }
            }
        } else {
            delete this._events[name];
        }
    } else {
        this._events = { };
    }

    return this;
};


function EventHandle(owner, name, fn) {
    this.owner = owner;
    this.name = name;
    this.fn = fn;
};

EventHandle.prototype.unbind = function() {
    if (! this.owner)
        return;

    this.owner.unbind(this.name, this.fn);

    this.owner = null;
    this.name = null;
    this.fn = null;
};

EventHandle.prototype.call = function() {
    if (! this.fn)
        return;

    this.fn.call(this.owner, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7]);
};

EventHandle.prototype.on = function(name, fn) {
    return this.owner.on(name, fn);
};
