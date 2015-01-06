"use strict";

function Observer(data, options) {
    Events.call(this);
    options = options || { };

    this.__destroyed = false;
    this.__path = '';
    this.__keys = [ ];
    this.__data = { };

    this.schema = options.schema;

    this.patch(data);
}
Observer.prototype = Object.create(Events.prototype);


Observer.prototype._prepare = function(target, key, value) {
    var self = this;
    var path = key;

    if (target.__path)
        path = target.__path + '.' + key;

    if (! target.hasOwnProperty(key)) {
        target.__keys.push(key);
        this._defineProperty(target, key);
    }

    var type = typeof(value);

    if (type === 'object' && (value instanceof Array)) {
        if (value.length === 0) {
            target.__data[key] = [ ];
        } else if(typeof(value[0]) === 'object' && ! (value[0] instanceof Array)) {
            target.__data[key] = new ObserverList();

            target.__data[key].on('add', function(item, index) {
                var parent = this.parent;

                item.on('*:set', function(path, value) {
                    path = (parent.__path ? parent.__path + '.' : '') + key + '.' + index + '.' + path;
                    self.emit(path, value);
                    self.emit('*:set', path, value);
                });
            }.bind({
                parent: target
            }));

            for(var i = 0; i < value.length; i++) {
                target.__data[key].add(new Observer(value[i]));
            }
        } else {
            target.__data[key] = value;

            for(var i = 0; i < value.length; i++) {
                this.emit(path + '.' + i + ':set', value[i]);
                this.emit('*:set', path + '.' + i, value[i]);
            }
        }
        this.emit(path + ':set', target.__data[key]);
        this.emit('*:set', path, target.__data[key]);
    } else if (type === 'object' && (value instanceof Object)) {
        var changed = false;
        if (! target.__data[key] || ! target.__data[key].__data) {
            target.__data[key] = {
                __path: path,
                __keys: [ ],
                __data: { }
            };
        }

        for(var i in value) {
            this._prepare(target.__data[key], i, value[i]);
        }

        this.emit(path + ':set', target.__data[key]);
        this.emit('*:set', path, target.__data[key]);
    } else {
        if (target.__data[key] === value)
            return;

        target.__data[key] = value;
        this.emit(path + ':set', value);
        this.emit('*:set', path, value);
    }
};


Observer.prototype._defineProperty = function(target, key) {
    var self = this;

    var path = key;
    if (target.__path)
        path = target.__path + '.' + key;

    Object.defineProperty(target, key, {
        configurable: true,
        get: function() {
            return this.__data[key];
        },
        set: function(value) {
            if (value === this.__data[key])
                return;

            this.__data[key] = value;
            self.emit(path + ':set', value);
            self.emit('*:set', path, value);
        }
    });
};


Observer.prototype.get = function(path) {
    var keys = path.split('.');
    var node = this;
    for (var i = 0; i < keys.length; i++) {
        if (node == undefined)
            return undefined;

        if (node.__data) {
            node = node.__data[keys[i]];
        } else if (node instanceof ObserverList) {
            node = node.get(keys[i]);
        } else {
            node = node[keys[i]];
        }
    }
    return node;
};


Observer.prototype.set = function(path, value) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var nodePath = '';
    var node = this;
    for(var i = 0; i < keys.length - 1; i++) {
        if (! node.hasOwnProperty(keys[i])) {
            if (node instanceof ObserverList) {
                node = node.get(parseInt(keys[i], 10) || keys[i]);
            } else {
                this._prepare(node, keys[i], { });
                node = node[keys[i]];
            }
        } else {
            node = node[keys[i]];
        }
    }

    if (! node.hasOwnProperty(key)) {
        this._prepare(node, key, value);
    } else {
        if (typeof(value) === 'object' && (value instanceof Array)) {
            if (value.equals(node[key]))
                return;

            node[key] = value;
        } else if (typeof(value) === 'object' && (value instanceof Object)) {
            this._prepare(node, key, value);

            for(var i = 0; i < node[key].__keys.length; i++) {
                if (! value.hasOwnProperty(node[key].__keys[i]))
                    this.unset((node[key].__path ? node[key].__path + '.' : '') + node[key].__keys[i]);
            }
        } else {
            if (node[key] === value)
                return false;

            node[key] = value;

            if (! node.__keys) {
                this.emit(path + ':set', value);
                this.emit('*:set', path, value);
            }
        }
    }

    return true;
};


Observer.prototype.unset = function(path) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node.__data && node.hasOwnProperty(keys[i])) {
            node = node.__data[keys[i]];
        } else {
            return false;
        }
    }

    if (! node.__data || ! node.hasOwnProperty(key))
        return false;

    // recursive
    if (node.__data[key] && node.__data[key].__data) {
        for(var i = 0; i < node.__data[key].__keys.length; i++) {
            this.unset(path + '.' + node.__data[key].__keys[i]);
        }
    }

    node.__keys.splice(node.__keys.indexOf(key), 1);
    delete node.__data[key];
    delete node[key];

    this.emit(path + ':unset');
    this.emit('*:unset', path);

    return true;
};


Observer.prototype.patch = function(data) {
    if (typeof(data) !== 'object')
        return;

    for(var key in data) {
        if (! this.__data.hasOwnProperty(key)) {
            this._prepare(this, key, data[key]);
        } else {
            this.set(key, data[key]);
        }
    }
};


Observer.prototype.json = function(target) {
    var obj = { };
    var node = target || this;

    if (node instanceof ObserverList)
        return node.json();

    var keys = node.__keys;

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = node.__data[key];
        var type = typeof(value);

        if (type === 'object' && (value instanceof Array)) {
            obj[key] = value;
        } else if (type === 'object' && (value instanceof Object)) {
            obj[key] = this.json(value);
        } else {
            obj[key] = value;
        }
    }
    return obj;
};


Observer.prototype.forEach = function(fn, target, path) {
    var node = target || this;
    path = path || '';

    for (var i = 0; i < node.__keys.length; i++) {
        var key = node.__keys[i];
        var value = node.__data[key];
        var type = (this.schema && this.schema.has(path + key) && this.schema.get(path + key).type.name.toLowerCase()) || typeof(value);

        if (type === 'object' && (value instanceof Array)) {
            fn(path + key, 'array', value, key);
        } else if (type === 'object' && (value instanceof Object)) {
            fn(path + key, 'object', value, key);
            this.forEach(fn, value, path + key + '.');
        } else {
            fn(path + key, type, value, key);
        }
    }
};


Observer.prototype.destroy = function() {
    if (this.__destroyed) return;
    this.__destroyed = true;
    this.emit('destroy');
    this.unbind();
};
