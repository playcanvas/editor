"use strict";

function Schema(data) {
    this.data = data;
}

Schema.prototype.has = function(path) {
    return this.data.hasOwnProperty(path);
};

Schema.prototype.set = function(path, args) {
    this.data[path] = args;
};

Schema.prototype.get = function(path) {
    return this.data[path] || null;
};

Schema.prototype.unset = function(path) {
    delete this.data[path];
};

Schema.prototype.valid = function(path, value) {
    // not defined
    if (! this.data.hasOwnProperty(path))
        return undefined;

    var field = this.data[path];

    // wrong type
    if (field.type === String) {
        if (typeof(value) !== 'string') {
            return undefined;
        }
    } else if (! (value instanceof field.type)) {
        return undefined;
    }

    // options
    if (field.type === String && field.options && field.options.indexOf(value) === -1)
        return undefined;

    // number
    if (field.type === Number) {
        // min
        if (field.min !== undefined && value < field.min)
            return field.min;

        // max
        if (field.max !== undefined && value > field.max)
            return field.max;
    }

    // custom validation method
    if (field.valid)
        return field.valid(value);

    // valid
    return value;
};
