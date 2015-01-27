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
        this.emit('event:on', fn);
    } else {
        if (events.indexOf(fn) == -1) {
            events.push(fn);
            this.emit('event:on', fn);
        }
    }
    return new EventHandle(this, name, fn);
    // return this;
};

Events.prototype.once = function(name, fn) {
    var events = this._events[name];
    fn.once = true;
    if (! events) {
        this._events[name] = [ fn ];
        this.emit('event:once', fn);
    } else {
        if (events.indexOf(fn) == -1) {
            events.push(fn);
            this.emit('event:once', fn);
        }
    }
    return new EventHandle(this, name, fn);
    // return this;
};

Events.prototype.emit = function(name) {
    var events = this._events[name];
    if (! events)
        return this;

    events = events.slice(0);

    var args = Array.prototype.slice.call(arguments, 1);

    for(var i = 0; i < events.length; i++) {
        if (! events[i])
            continue;

        try {
            events[i].apply(this, args);
        } catch(ex) {
            console.info('%c%s %c(event error)', 'color: #06f', name, 'color: #f00');
            console.log(ex.stack);
        }

        if (events[i] && events[i].once && this._events[name]) {
            this._events[name].splice(this._events[name].indexOf(events[i]), 1);
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

    this.fn.apply(this.owner, arguments);
};

EventHandle.prototype.on = function(name, fn) {
    return this.owner.on(name, fn);
};
