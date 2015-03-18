"use strict";

function Slider(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._value = 0;

    this.precision = isNaN(args.precision) ? 2 : args.precision;
    this._min = isNaN(args.min) ? 0 : args.min;
    this._max = isNaN(args.max) ? 1 : args.max;

    this.element = document.createElement('div');
    this.element.classList.add('ui-slider');

    this.elementBar = document.createElement('div');
    this.elementBar.classList.add('bar');
    this.element.appendChild(this.elementBar);

    this.elementHandle = document.createElement('div');
    this.elementHandle.tabIndex = 0;
    this.elementHandle.classList.add('handle');
    this.elementBar.appendChild(this.elementHandle);

    this.element.addEventListener('mousedown', this._onMouseDown.bind(this), false);
    this.evtMouseMove = null;
    this.evtMouseUp = null;

    this.on('change', function() {
        if (! this.renderChanges)
            return;

        this.flash();
    });

    // arrows - change
    this.element.addEventListener('keydown', function(evt) {
        if (evt.keyCode === 27)
            return self.elementHandle.blur();

        if (self.disabled || [ 37, 39 ].indexOf(evt.keyCode) === -1)
            return;

        evt.stopPropagation();
        evt.preventDefault();

        var x = evt.keyCode === 37 ? -1 : 1;

        if (evt.shiftKey)
            x *= 10;

        var rect = self.element.getBoundingClientRect();
        var step = (self._max - self._min) / rect.width;
        var value = Math.max(self._min, Math.min(self._max, self.value + x * step));
        value = parseFloat(value.toFixed(self.precision), 10);

        self.renderChanges = false;
        self._updateHandle(value);
        self.value = value;
        self.renderChanges = true;
    }, false);
}
Slider.prototype = Object.create(ui.Element.prototype);


Slider.prototype._onLinkChange = function(value) {
    this._updateHandle(value);
    this._value = value;
    this.emit('change', value || 0);
};


Slider.prototype._updateHandle = function(value) {
    this.elementHandle.style.left = (Math.max(0, Math.min(1, value / (this._max - this._min))) * 100) + '%';
};


Slider.prototype._handleEvt = function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var rect = this.element.getBoundingClientRect();
    var x = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width));

    var range = this._max - this._min;
    var value = (x * range);
    value = parseFloat(value.toFixed(this.precision), 10);

    this._updateHandle(value);
    this.value = value;
};


Slider.prototype._onMouseDown = function(evt) {
    if (evt.button !== 0 || this.disabled)
        return;

    this.elementHandle.focus();

    this.renderChanges = false;

    this.evtMouseMove = this._onMouseMove.bind(this);
    window.addEventListener('mousemove', this.evtMouseMove, false);

    this.evtMouseUp = this._onMouseUp.bind(this);
    window.addEventListener('mouseup', this.evtMouseUp, false);

    this.class.add('active');

    this._handleEvt(evt);

    if (this._link && this._link.history)
        this._link.history.combine = true;
};


Slider.prototype._onMouseMove = function(evt) {
    this._handleEvt(evt);
};


Slider.prototype._onMouseUp = function(evt) {
    this._handleEvt(evt);

    this.renderChanges = true;

    this.class.remove('active');

    window.removeEventListener('mousemove', this.evtMouseMove);
    window.removeEventListener('mouseup', this.evtMouseUp);

    if (this._link && this._link.history)
        this._link.history.combine = false;
};


Object.defineProperty(Slider.prototype, 'min', {
    get: function() {
        return this._min;
    },
    set: function(value) {
        if (this._min === value)
            return;

        this._min = value;
        this._updateHandle(this._value);
    }
});


Object.defineProperty(Slider.prototype, 'max', {
    get: function() {
        return this._max;
    },
    set: function(value) {
        if (this._max === value)
            return;

        this._max = value;
        this._updateHandle(this._value);
    }
});


Object.defineProperty(Slider.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return this._value;
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value))
                this._updateHandle(this._link.get(this.path));
        } else {
            if (this._max !== null && this._max < value)
                value = this._max;

            if (this._min !== null && this._min > value)
                value = this._min;

            value = (this.precision !== null) ? parseFloat(value.toFixed(this.precision), 10) : value;
            this._updateHandle(value);
            this._value = value;

            if (this._lastValue !== value) {
                this._lastValue = value;
                this.emit('change', value);
            }
        }
    }
});


window.ui.Slider = Slider;
