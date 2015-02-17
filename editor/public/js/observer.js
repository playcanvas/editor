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
        var changed = false;
        var oldData = (target.__data[key] && ((target.__data[key] instanceof ObserverList && target.__data[key].json()) || target.__data[key].slice(0))) || [ ];

        if (value.length === 0) {
            if (! target.__data[key] || target.__data[key].length !== 0) {
                changed = true;
                target.__data[key] = [ ];
            }
        } else if(value[0] && typeof(value[0]) === 'object' && ! (value[0] instanceof Array)) {
            changed = true;
            target.__data[key] = new ObserverList();

            target.__data[key].on('add', function(item, index) {
                var parent = this.parent;

                item.___evtObserverListSet = item.on('*:set', function(path, value, oldValue) {
                    path = (parent.__path ? parent.__path + '.' : '') + key + '.' + index + '.' + path;
                    self.emit(path + ':set', value, oldValue);
                    self.emit('*:set', path, value, oldValue);
                });
            }.bind({
                parent: target
            }));

            target.__data[key].on('remove', function(item) {
                if (! item.___evtObserverListSet)
                    return;
                item.___evtObserverListSet.unbind();
            });

            for(var i = 0; i < value.length; i++) {
                target.__data[key].add(new Observer(value[i]));
            }
        } else {
            if (target.__data[key] && target.__data[key].length === value.length) {
                // same length, update carefully
                for(var i = 0; i < value.length; i++) {
                    if (target.__data[key][i] !== value[i]) {
                        changed = true;
                        var oldValue = target.__data[key][i];
                        target.__data[key][i] = value[i];
                        this.emit(path + '.' + i + ':set', value[i], oldValue);
                        this.emit('*:set', path + '.' + i, value[i], oldValue);
                    }
                }
            } else {
                // different length, update whole array
                changed = true;
                target.__data[key] = value.slice(0);
                for(var i = 0; i < value.length; i++) {
                    this.emit(path + '.' + i + ':set', value[i], oldData[i]);
                    this.emit('*:set', path + '.' + i, value[i], oldData[i]);
                }
            }
        }
        if (changed) {
            var data = target.__data[key];
            if (data instanceof ObserverList)
                data = data.json();

            this.emit(path + ':set', data, oldData);
            this.emit('*:set', path, data, oldData);
        }
    } else if (type === 'object' && (value instanceof Object)) {
        var changed = false;
        if (! target.__data[key] || ! target.__data[key].__data) {
            target.__data[key] = {
                __path: path,
                __keys: [ ],
                __data: { }
            };
        }

        // history hook to prevent array values to be recorded
        var historyState = this.history && this.history.enabled;
        if (historyState)
            this.history.enabled = false;

        // sync hook to prevent array values to be recorded as array root already did
        var syncState = this.sync && this.sync.enabled;
        if (syncState)
            this.sync.enabled = false;

        for(var i in value) {
            this._prepare(target.__data[key], i, value[i]);
        }

        if (syncState)
            this.sync.enabled = true;

        if (historyState)
            this.history.enabled = true;

        this.emit(path + ':set', value);
        this.emit('*:set', path, value);
    } else {
        if (target.__data[key] === value)
            return;

        var oldValue = target.__data[key];
        target.__data[key] = value;
        this.emit(path + ':set', value, oldValue);
        this.emit('*:set', path, value, oldValue);
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

            if (typeof(this.__data[key]) === 'object' && (this.__data[key] instanceof Array)) {
                var oldValue = this.__data[key].slice(0);
                this.__data[key] = value;

                // history hook to prevent array values to be recorded
                var historyState = self.history && self.history.enabled;
                if (historyState)
                    self.history.enabled = false;

                // sync hook to prevent array values to be recorded as array root already did
                var syncState = self.sync && self.sync.enabled;
                var syncSingle = -1;
                if (syncState) {
                    self.sync.enabled = false;

                    // check if single value set
                    for(var i = 0; i < this.__data[key].length; i++) {
                        if(this.__data[key][i] !== oldValue[i] && syncSingle !== -2) {
                            if (syncSingle === -1) {
                                syncSingle = i;
                            } else {
                                syncSingle = -2;
                                break;
                            }
                        }
                    }

                    // if so, then allow sync of that single value
                    if (syncSingle >= 0)
                        self.sync.enabled = true;
                }

                // emit each value set event
                for(var i = 0; i < this.__data[key].length; i++) {
                    if(this.__data[key][i] !== oldValue[i]) {
                        self.emit(path + '.' + i + ':set', this.__data[key][i], oldValue[i]);
                        self.emit('*:set', path + '.' + i, this.__data[key][i], oldValue[i]);
                    }
                }

                // bring back history state
                if (historyState)
                    self.history.enabled = true;

                // bring back sync state if not a single value update
                if (syncState)
                    self.sync.enabled = syncSingle < 0;

                self.emit(path + ':set', value, oldValue);
                self.emit('*:set', path, value, oldValue);

                // bring back sync state
                if (syncState)
                    self.sync.enabled = true;
            } else {
                var oldValue = this.__data[key];
                this.__data[key] = value;
                self.emit(path + ':set', value, oldValue);
                self.emit('*:set', path, value, oldValue);
            }
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

    if (node instanceof Array) {
        var ind = parseInt(key, 10);
        if (node[ind] === value)
            return;

        var oldValue = node[ind];

        node[ind] = value;
        this.emit(path + ':set', value, oldValue);
        this.emit('*:set', path, value, oldValue);
    } else if (! node.hasOwnProperty(key)) {
        this._prepare(node, key, value);
    } else {
        if (typeof(value) === 'object' && (value instanceof Array)) {
            if (node[key] instanceof ObserverList) {
                node[key].clear();
                for(var i = 0; i < value.length; i++) {
                    node[key].add(new Observer(value[i]));
                }
            } else if (value.length && typeof(value[0]) === 'object') {
                this.unset(node.__path + '.' + key);
                this._prepare(node, key, value);
            } else {
                if (value.equals(node[key]))
                    return;

                node[key] = value;
            }
        } else if (typeof(value) === 'object' && (value instanceof Object)) {
            this._prepare(node, key, value);

            for(var i = 0; i < node[key].__keys.length; i++) {
                if (! value.hasOwnProperty(node[key].__keys[i]))
                    this.unset((node[key].__path ? node[key].__path + '.' : '') + node[key].__keys[i]);
            }
        } else {
            if (node[key] === value)
                return false;

            var oldValue = node[key];
            node[key] = value;

            if (! node.__keys) {
                this.emit(path + ':set', value, oldValue);
                this.emit('*:set', path, value, oldValue);
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

    var valueOld = this.json(node.__data[key]);

    // history hook to prevent array values to be recorded
    var historyState = this.history && this.history.enabled;
    if (historyState)
        this.history.enabled = false;

    // sync hook to prevent array values to be recorded as array root already did
    var syncState = this.sync && this.sync.enabled;
    if (syncState)
        this.sync.enabled = false;

    // recursive
    if (node.__data[key] && node.__data[key].__data) {
        for(var i = 0; i < node.__data[key].__keys.length; i++) {
            this.unset(path + '.' + node.__data[key].__keys[i]);
        }
    }

    // bring back history state
    if (historyState)
        this.history.enabled = true;

    // bring back sync state if not a single value update
    if (syncState)
        this.sync.enabled = true;

    node.__keys.splice(node.__keys.indexOf(key), 1);
    delete node.__data[key];
    delete node[key];

    this.emit(path + ':unset', valueOld);
    this.emit('*:unset', path, valueOld);

    return true;
};


Observer.prototype.remove = function(path, value) {
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

    if (! node.__data || ! node.hasOwnProperty(key) || ! (node.__data[key] instanceof Array))
        return false;

    var arr = node.__data[key];
    var ind = arr.indexOf(value);

    if (ind === -1)
        return false;

    arr.splice(ind, 1);

    this.emit(path + ':remove', value, ind);
    this.emit('*:remove', path, value, ind);

    return true;
};


Observer.prototype.insert = function(path, value, ind) {
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

    if (! node.__data || ! node.hasOwnProperty(key) || ! (node.__data[key] instanceof Array))
        return false;

    var arr = node.__data[key];

    if (arr.indexOf(value) !== -1)
        return false;

    if (ind === undefined) {
        arr.push(value);
        ind = arr.length - 1;
    } else {
        arr.splice(ind, 0, value);
    }

    this.emit(path + ':insert', value, ind);
    this.emit('*:insert', path, value, ind);

    return true;
};


Observer.prototype.move = function(path, value, ind) {
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

    if (! node.__data || ! node.hasOwnProperty(key) || ! (node.__data[key] instanceof Array))
        return false;

    var arr = node.__data[key];
    var indOld = arr.indexOf(value);
    if (indOld === -1)
        return false;

    if (indOld === ind)
        return;

    arr.splice(indOld, 1);

    if (ind === undefined || ind === -1) {
        arr.push(value);
        ind = arr.length - 1;
    } else {
        arr.splice(ind, 0, value);
    }

    this.emit(path + ':move', value, ind, indOld);
    this.emit('*:move', path, value, ind, indOld);

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
    var node = target === undefined ? this : target;

    if (node instanceof ObserverList)
        return node.json();

    if (node instanceof Object && node.__keys) {
        for (var i = 0; i < node.__keys.length; i++) {
            var key = node.__keys[i];
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
    } else {
        if (typeof(node) === 'object' && (node instanceof Array)) {
            obj = node.slice(0);
        } else if (typeof(node) === 'object') {
            for(var key in node) {
                if (node.hasOwnProperty(key))
                    obj[key] = node;
            }
        } else {
            obj = node;
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
