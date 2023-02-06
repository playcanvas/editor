function ColorField(args) {
    var self = this; // eslint-disable-line no-unused-vars
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this._element.tabIndex = 0;
    this._element.classList.add('ui-color-field', 'rgb');

    this.elementColor = document.createElement('span');
    this.elementColor.classList.add('color');
    this._element.appendChild(this.elementColor);

    this._channels = args.channels || 3;
    this._values = [0, 0, 0, 0];

    // space > click
    this._element.addEventListener('keydown', this._onKeyDown, false);

    // render color back
    this.on('change', this._onChange);

    // link to channels
    this.evtLinkChannels = [];
    this.on('link', this._onLink);
    this.on('unlink', this._onUnlink);
}
ColorField.prototype = Object.create(ui.Element.prototype);

ColorField.prototype._onKeyDown = function (evt) {
    if (evt.keyCode === 27)
        return this.blur();

    if (evt.keyCode !== 13 || this.ui.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.ui.emit('click');
};

ColorField.prototype._onChange = function (color) {
    if (this._channels === 1) {
        this.elementColor.style.backgroundColor = 'rgb(' + [this.r, this.r, this.r].join(',') + ')';
    } else if (this._channels === 3) {
        this.elementColor.style.backgroundColor = 'rgb(' + this._values.slice(0, 3).join(',') + ')';
    } else if (this._channels === 4) {
        var rgba = this._values.slice(0, 4);
        rgba[3] /= 255;
        this.elementColor.style.backgroundColor = 'rgba(' + rgba.join(',') + ')';
    } else {
        console.log('unknown channels', color);
    }
};

ColorField.prototype._onLink = function () {
    for (var i = 0; i < 4; i++) {
        this.evtLinkChannels[i] = this._link.on(this.path + '.' + i + ':set', function (value) {
            this._setValue(this._link.get(this.path));
        }.bind(this));
    }
};

ColorField.prototype._onUnlink = function () {
    for (var i = 0; i < this.evtLinkChannels.length; i++)
        this.evtLinkChannels[i].unbind();

    this.evtLinkChannels = [];
};

ColorField.prototype._onLinkChange = function (value) {
    if (!value)
        return;

    this._setValue(value);
};

Object.defineProperty(ColorField.prototype, 'value', {
    get: function () {
        if (this._link) {
            return this._link.get(this.path).map(function (channel) {
                return Math.floor(channel * 255);
            });
        }
        return this._values.slice(0, this._channels);

    },
    set: function (value) {
        if (!value) {
            this.class.add('null');
            return;
        }
        this.class.remove('null');


        if (this._link) {
            this._link.set(this.path, value.map(function (channel) {
                return channel / 255;
            }));
        } else {
            this._setValue(value);
        }
    }
});

ColorField.prototype._setValue = function (value) {
    var changed = false;

    if (!value)
        return;

    if (value.length !== this._channels) {
        changed = true;
        this.channels = value.length;
    }

    for (var i = 0; i < this._channels; i++) {
        if (this._values[i] === Math.floor(value[i]))
            continue;

        changed = true;
        this._values[i] = Math.floor(value[i]);
    }

    if (changed)
        this.emit('change', this._values.slice(0, this._channels));
};


Object.defineProperty(ColorField.prototype, 'channels', {
    get: function () {
        return this._channels;
    },
    set: function (value) {
        if (this._channels === value)
            return;

        this._channels = value;
        this.emit('channels', this._channels);
    }
});


Object.defineProperty(ColorField.prototype, 'r', {
    get: function () {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.0') * 255);
        }
        return this._values[0];

    },
    set: function (value) {
        value = Math.min(0, Math.max(255, value));

        if (this._values[0] === value)
            return;

        this._values[0] = value;
        this.emit('r', this._values[0]);
        this.emit('change', this._values.slice(0, this._channels));
    }
});


Object.defineProperty(ColorField.prototype, 'g', {
    get: function () {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.1') * 255);
        }
        return this._values[1];

    },
    set: function (value) {
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
    get: function () {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.2') * 255);
        }
        return this._values[2];

    },
    set: function (value) {
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
    get: function () {
        if (this._link) {
            return Math.floor(this._link.get(this.path + '.3') * 255);
        }
        return this._values[3];

    },
    set: function (value) {
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
    get: function () {
        var values = this._values;

        if (this._link) {
            values = this._link.get(this.path).map(function (channel) {
                return Math.floor(channel * 255);
            });
        }

        var hex = '';
        for (var i = 0; i < this._channels; i++) {
            hex += ('00' + values[i].toString(16)).slice(-2);
        }
        return hex;
    },
    set: function (value) {
        console.log('todo');
    }
});


window.ui.ColorField = ColorField;
