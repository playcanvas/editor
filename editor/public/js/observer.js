"use strict";

function Observer(data, options) {
    Events.call(this);
    options = options || { };

    this._destroyed = false;
    this._path = '';
    this._keys = [ ];
    this._data = { };

    this.patch(data);

    this._parent = options.parent || null;
    this._parentPath = options.parentPath || '';
    this._parentField = options.parentField || null;
    this._parentKey = options.parentKey || null;


    // propagate set
    this.on('*:set', function(path, value, valueOld) {
        if (! this._parent)
            return;

        var key = this._parentKey;
        if (! key && (this._parentField instanceof Array)) {
            key = this._parentField.indexOf(this);

            if (key === -1)
                return;
        }

        path = this._parentPath + '.' + key + '.' + path;

        this._parent.emit(path + ':set', value, valueOld);
        this._parent.emit('*:set', path, value, valueOld);
    });


    // propagate unset
    this.on('*:unset', function(path, value, valueOld) {
        if (! this._parent)
            return;

        var key = this._parentKey;
        if (! key && (this._parentField instanceof Array)) {
            key = this._parentField.indexOf(this);

            if (key === -1)
                return;
        }

        path = this._parentPath + '.' + key + '.' + path;

        this._parent.emit(path + ':unset', value, valueOld);
        this._parent.emit('*:unset', path, value, valueOld);
    });
}
Observer.prototype = Object.create(Events.prototype);


Observer.prototype._prepare = function(target, key, value, silent) {
    var self = this;
    var path = (target._path ? (target._path + '.') : '') + key;
    var type = typeof(value);

    target._keys.push(key);

    if (type === 'object' && (value instanceof Array)) {
        target._data[key] = value.slice(0);

        for(var i = 0; i < target._data[key].length; i++) {
            if (typeof(target._data[key][i]) === 'object') {
                target._data[key][i] = new Observer(target._data[key][i], {
                    parent: this,
                    parentPath: path,
                    parentField: target._data[key],
                    parentKey: null
                });
            }
        }

        if (! silent) {
            this.emit(path + ':set', target._data[key], null);
            this.emit('*:set', path, target._data[key], null);
        }
    } else if (type === 'object' && (value instanceof Object)) {
        target._data[key] = {
            _path: path,
            _keys: [ ],
            _data: { }
        };

        // history hook to prevent array values to be recorded
        var historyState = this.history && this.history.enabled;
        if (historyState)
            this.history.enabled = false;

        // sync hook to prevent array values to be recorded as array root already did
        var syncState = this.sync && this.sync.enabled;
        if (syncState)
            this.sync.enabled = false;

        for(var i in value) {
            if (typeof(value[i]) === 'object') {
                this._prepare(target._data[key], i, value[i], true);
            } else {
                target._data[key]._data[i] = value[i];
                target._data[key]._keys.push(i);

                if (! silent) {
                    this.emit(path + '.' + i + ':set', value[i], null);
                    this.emit('*:set', path + '.' + i, value[i], null);
                }
            }
        }

        if (syncState)
            this.sync.enabled = true;

        if (historyState)
            this.history.enabled = true;

        if (! silent) {
            this.emit(path + ':set', value);
            this.emit('*:set', path, value);
        }
    }
};


Observer.prototype.get = function(path, raw) {
    var keys = path.split('.');
    var node = this;
    for (var i = 0; i < keys.length; i++) {
        if (node == undefined)
            return undefined;

        if (node._data) {
            node = node._data[keys[i]];
        } else {
            node = node[keys[i]];
        }
    }

    if (raw)
        return node;

    if (node == null) {
        return null;
    } else {
        return this.json(node);
    }
};


Observer.prototype.getRaw = function(path) {
    return this.get(path, true);
};


Observer.prototype.has = function(path) {
    var keys = path.split('.');
    var node = this;
    for (var i = 0; i < keys.length; i++) {
        if (node == undefined)
            return undefined;

        if (node._data) {
            node = node._data[keys[i]];
        } else {
            node = node[keys[i]];
        }
    }

    return node !== undefined;
}


Observer.prototype.set = function(path, value, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;
    var nodePath = '';
    var obj = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node instanceof Array) {
            node = node[keys[i]];
        } else {
            if (node instanceof Observer) {
                path = keys.slice(i).join('.');
                obj = node;
            }

            if (i < keys.length && typeof(node._data[keys[i]]) !== 'object') {
                if (node._data[keys[i]])
                    obj.unset((node.__path ? node.__path + '.' : '') + keys[i]);

                node._data[keys[i]] = {
                    _path: path,
                    _keys: [ ],
                    _data: { }
                };
                node._keys.push(keys[i]);
            }

            if (i === keys.length - 1 && node.__path)
                nodePath = node.__path + '.' + keys[i];

            node = node._data[keys[i]];
        }
    }

    if (node instanceof Array) {
        var ind = parseInt(key, 10);
        if (node[ind] === value)
            return;

        var valueOld = node[ind];
        if (! (valueOld instanceof Observer))
            valueOld = obj.json(valueOld);

        node[ind] = value;

        if (value instanceof Observer) {
            value._parent = obj;
            value._parentPath = nodePath;
            value._parentField = node;
            value._parentKey = null;
        }

        if (! silent) {
            obj.emit(path + ':set', value, valueOld);
            obj.emit('*:set', path, value, valueOld);
        }
    } else if (node._data && ! node._data.hasOwnProperty(key)) {
        if (typeof(value) === 'object') {
            obj._prepare(node, key, value);
        } else {
            node._data[key] = value;
            node._keys.push(key);

            if (! silent) {
                obj.emit(path + ':set', value, null);
                obj.emit('*:set', path, value, null);
            }
        }
    } else {
        if (typeof(value) === 'object' && (value instanceof Array)) {
            if (value.equals(node._data[key]))
                return;

            var valueOld = node._data[key];
            if (! (valueOld instanceof Observer))
                valueOld = obj.json(valueOld);

            node._data[key] = value;

            if (! silent) {
                obj.emit(path + ':set', value, valueOld);
                obj.emit('*:set', path, value, valueOld);
            }
        } else if (typeof(value) === 'object' && (value instanceof Object)) {
            obj._prepare(node, key, value);
        } else {
            if (node._data[key] === value)
                return false;

            var valueOld = node._data[key];
            if (! (valueOld instanceof Observer))
                valueOld = obj.json(valueOld);

            node._data[key] = value;

            if (! silent) {
                obj.emit(path + ':set', value, valueOld);
                obj.emit('*:set', path, value, valueOld);
            }
        }
    }

    return true;
};


Observer.prototype.unset = function(path, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return false;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key))
        return false;

    var valueOld = node._data[key];
    if (! (valueOld instanceof Observer))
        valueOld = this.json(valueOld);

    // history hook to prevent array values to be recorded
    var historyState = this.history && this.history.enabled;
    if (historyState)
        this.history.enabled = false;

    // sync hook to prevent array values to be recorded as array root already did
    var syncState = this.sync && this.sync.enabled;
    if (syncState)
        this.sync.enabled = false;

    // recursive
    if (node._data[key] && node._data[key]._data) {
        for(var i = 0; i < node._data[key]._keys.length; i++) {
            this.unset(path + '.' + node._data[key]._keys[i]);
        }
    }

    // bring back history state
    if (historyState)
        this.history.enabled = true;

    // bring back sync state if not a single value update
    if (syncState)
        this.sync.enabled = true;

    node._keys.splice(node._keys.indexOf(key), 1);
    delete node._data[key];
    // delete node[key];

    if (! silent) {
        this.emit(path + ':unset', valueOld);
        this.emit('*:unset', path, valueOld);
    }

    return true;
};


Observer.prototype.remove = function(path, ind, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];
    if (arr.length < ind)
        return;

    var value = arr[ind];
    if (value instanceof Observer) {
        value._parent = null;
    } else {
        value = this.json(value);
    }

    arr.splice(ind, 1);

    if (! silent) {
        this.emit(path + ':remove', value, ind);
        this.emit('*:remove', path, value, ind);
    }

    return true;
};


Observer.prototype.removeValue = function(path, value, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];

    var ind = arr.indexOf(value);
    if (ind === -1)
        return;

    if (arr.length < ind)
        return;

    var value = arr[ind];
    if (value instanceof Observer) {
        value._parent = null;
    } else {
        value = this.json(value);
    }

    arr.splice(ind, 1);

    if (! silent) {
        this.emit(path + ':remove', value, ind);
        this.emit('*:remove', path, value, ind);
    }

    return true;
};


Observer.prototype.insert = function(path, value, ind, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];

    if (typeof(value) === 'object' && ! (value instanceof Observer))
        value = new Observer(value);

    if (arr.indexOf(value) !== -1)
        return;

    if (ind === undefined) {
        arr.push(value);
        ind = arr.length - 1;
    } else {
        arr.splice(ind, 0, value);
    }

    if (value instanceof Observer) {
        value._parent = this;
        value._parentPath = node._path + '.' + key;
        value._parentField = arr;
        value._parentKey = null;
    } else {
        value = this.json(value);
    }

    if (! silent) {
        this.emit(path + ':insert', value, ind);
        this.emit('*:insert', path, value, ind);
    }

    return true;
};


Observer.prototype.move = function(path, indOld, indNew, silent) {
    var keys = path.split('.');
    var key = keys[keys.length - 1];
    var node = this;

    for(var i = 0; i < keys.length - 1; i++) {
        if (node._data && node._data.hasOwnProperty(keys[i])) {
            node = node._data[keys[i]];
        } else {
            return;
        }
    }

    if (! node._data || ! node._data.hasOwnProperty(key) || ! (node._data[key] instanceof Array))
        return;

    var arr = node._data[key];

    if (arr.length < indOld || arr.length < indNew || indOld === indNew)
        return;

    var value = arr[indOld];

    arr.splice(indOld, 1);
    arr.splice(indNew, 0, value);

    if (! (value instanceof Observer))
        value = this.json(value);

    if (! silent) {
        this.emit(path + ':move', value, indNew, indOld);
        this.emit('*:move', path, value, indNew, indOld);
    }

    return true;
};


Observer.prototype.patch = function(data) {
    if (typeof(data) !== 'object')
        return;

    for(var key in data) {
        if (typeof(data[key]) === 'object' && ! this._data.hasOwnProperty(key)) {
            this._prepare(this, key, data[key]);
        } else {
            this.set(key, data[key]);
        }
    }
};


Observer.prototype.json = function(target) {
    var obj = { };
    var node = target === undefined ? this : target;

    if (node instanceof Object && node._keys) {
        for (var i = 0; i < node._keys.length; i++) {
            var key = node._keys[i];
            var value = node._data[key];
            var type = typeof(value);

            if (type === 'object' && (value instanceof Array)) {
                obj[key] = value.slice(0);

                for(var n = 0; n < obj[key].length; n++) {
                    obj[key][n] = this.json(obj[key][n]);
                }
            } else if (type === 'object' && (value instanceof Object)) {
                obj[key] = this.json(value);
            } else {
                obj[key] = value;
            }
        }
    } else {
        if (typeof(node) === 'object' && (node instanceof Array)) {
            obj = node.slice(0);

            for(var n = 0; n < obj.length; n++) {
                obj[n] = this.json(obj[n]);
            }
        } else if (typeof(node) === 'object') {
            for(var key in node) {
                if (node.hasOwnProperty(key))
                    obj[key] = node[key];
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

    for (var i = 0; i < node._keys.length; i++) {
        var key = node._keys[i];
        var value = node._data[key];
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
    if (this._destroyed) return;
    this._destroyed = true;
    this.emit('destroy');
    this.unbind();
};
