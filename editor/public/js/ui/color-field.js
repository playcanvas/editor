"use strict"

function ColorField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-color-field', 'rgb');

    this.elementColor = document.createElement('span');
    this.elementColor.classList.add('color');
    this.element.appendChild(this.elementColor);

    this.elementIcon = document.createElement('span');
    this.elementIcon.classList.add('icon');
    this.element.appendChild(this.elementIcon);

    this._channels = args.channels || 3;
    this._values = [ 0, 0, 0, 0 ];

    // render color back
    this.on('change', function(color) {
        if (this._channels === 1) {
            this.elementColor.style.backgroundColor = 'rgb(' + [ this.r, this.r, this.r ].join(',') + ')';
        } else if (this._channels === 3) {
            this.elementColor.style.backgroundColor = 'rgb(' + this._values.slice(0, 3).join(',') + ')';
        } else if (this._channels === 4) {
            this.elementColor.style.backgroundColor = 'rgba(' + this._values.slice(0, 4).join(',') + ')';
        } else {
            console.log('unknown channels', color);
        }
    });

    // link to channels
    var evtLinkChannels = [ ];
    this.on('link', function() {
        for(var i = 0; i < 4; i++) {
            evtLinkChannels[i] = this._link.on(this.path + '.' + i + ':set', function(value) {
                this._setValue(this._link.get(this.path));
            }.bind(this));
        }
    });
    this.on('unlink', function() {
        for(var i = 0; i < evtLinkChannels.length; i++)
            evtLinkChannels[i].unbind();

        evtLinkChannels = [ ];
    });
}
ColorField.prototype = Object.create(ui.Element.prototype);


ColorField.prototype._onLinkChange = function(value) {
    if (! value)
        return;

    this._setValue(value);
};

Object.defineProperty(ColorField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path).map(function(channel) {
                return Math.floor(channel * 255);
            });
        } else {
            return this._values.slice(0, this._channels);
        }
    },
    set: function(value) {
        if (this._link) {
            this._link.set(this.path, value);
        } else {
            this._setValue(value);
        }
    }
});

ColorField.prototype._setValue = function(value) {
    var changed = false;

    if (value.length !== this._channels) {
        changed = true;
        this.channels = value.length;
    }

    for(var i = 0; i < this._channels; i++) {
        if (this._values[i] === Math.floor(value[i] * 255))
            continue;

        changed = true;
        this._values[i] = Math.floor(value[i] * 255);
    }

    if (changed)
        this.emit('change', this._values.slice(0, this._channels));
};


Object.defineProperty(ColorField.prototype, 'channels', {
    get: function() {
        return this._channels;
    },
    set: function(value) {
        if (this._channels === value)
            return;

        this._channels = value;
        this.emit('channels', this._channels);
    }
});


Object.defineProperty(ColorField.prototype, 'r', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.0') * 255);
        } else {
            return this._values[0];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[0] === value)
            return;

        this._values[0] = value;
        this.emit('r', this._values[0]);
        this.emit('change', this._values.slice(0, this._channels));
    }
});


Object.defineProperty(ColorField.prototype, 'g', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.1') * 255);
        } else {
            return this._values[1];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[1] === value)
            return;

        this._values[1] = value;

        if (this._channels >= 2) {
            this.emit('g', this._values[1]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
});


Object.defineProperty(ColorField.prototype, 'b', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.2') * 255);
        } else {
            return this._values[2];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[2] === value)
            return;

        this._values[2] = value;

        if (this._channels >= 3) {
            this.emit('b', this._values[2]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
});


Object.defineProperty(ColorField.prototype, 'a', {
    get: function() {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.3') * 255);
        } else {
            return this._values[3];
        }
    },
    set: function(value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[3] === value)
            return;

        this._values[3] = value;

        if (this._channels >= 4) {
            this.emit('a', this._values[3]);
            this.emit('change', this._values.slice(0, this._channels));
        }
    }
});


Object.defineProperty(ColorField.prototype, 'hex', {
    get: function() {
        var values = this._values;

        if (this._link) {
            values = this._link.get(this.path).map(function(channel) {
                return Math.floor(channel * 255);
            });
        }

        var hex = '';
        for(var i = 0; i < this._channels; i++) {
            hex += ('00' + values[i].toString(16)).slice(-2);
        }
        return hex;
    },
    set: function(value) {
        console.log('todo');
    }
});


window.ui.ColorField = ColorField;
