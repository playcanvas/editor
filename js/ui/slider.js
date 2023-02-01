"use strict";

function Slider(args) {
    var self = this;
    ui.Element.call(this);
    args = args || { };

    this._value = 0;
    this._lastValue = 0;

    this.precision = isNaN(args.precision) ? 2 : args.precision;
    this._min = isNaN(args.min) ? 0 : args.min;
    this._max = isNaN(args.max) ? 1 : args.max;

    this.element = document.createElement('div');
    this.element.classList.add('ui-slider');

    this.elementBar = document.createElement('div');
    this.elementBar.ui = this;
    this.elementBar.classList.add('bar');
    this.element.appendChild(this.elementBar);

    this.elementHandle = document.createElement('div');
    this.elementHandle.ui = this;
    this.elementHandle.tabIndex = 0;
    this.elementHandle.classList.add('handle');
    this.elementBar.appendChild(this.elementHandle);

    this.element.addEventListener('mousedown', this._onMouseDown, false);
    this.element.addEventListener('touchstart', this._onTouchStart, false);

    this.evtMouseMove = function (evt) {
        evt.stopPropagation();
        evt.preventDefault();

        self._onSlideMove(evt.pageX);
    };
    this.evtMouseUp = function (evt) {
        evt.stopPropagation();
        evt.preventDefault();

        self._onSlideEnd(evt.pageX);
    };

    this.evtTouchId = null;

    this.evtTouchMove = function (evt) {
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];

            if (touch.identifier !== self.evtTouchId)
                continue;

            evt.stopPropagation();
            evt.preventDefault();

            self._onSlideMove(touch.pageX);
            break;
        }
    };
    this.evtTouchEnd = function (evt) {
        for (var i = 0; i < evt.changedTouches.length; i++) {
            var touch = evt.changedTouches[i];

            if (touch.identifier !== self.evtTouchId)
                continue;

            evt.stopPropagation();
            evt.preventDefault();

            self._onSlideEnd(touch.pageX);
            self.evtTouchId = null;
            break;
        }
    };

    this.on('change', this.__onChange);

    // arrows - change
    this.element.addEventListener('keydown', this._onKeyDown, false);
}
Slider.prototype = Object.create(ui.Element.prototype);


Slider.prototype._onChange = function () {
    if (!this.renderChanges)
        return;

    this.flash();
};


Slider.prototype._onKeyDown = function (evt) {
    if (evt.keyCode === 27)
        return this.ui.elementHandle.blur();

    if (this.ui.disabled || [37, 39].indexOf(evt.keyCode) === -1)
        return;

    evt.stopPropagation();
    evt.preventDefault();

    var x = evt.keyCode === 37 ? -1 : 1;

    if (evt.shiftKey)
        x *= 10;

    var rect = this.getBoundingClientRect();
    var step = (this.ui._max - this.ui._min) / rect.width;
    var value = Math.max(this.ui._min, Math.min(this.ui._max, this.ui.value + x * step));
    value = parseFloat(value.toFixed(this.ui.precision), 10);

    this.ui.renderChanges = false;
    this.ui._updateHandle(value);
    this.ui.value = value;
    this.ui.renderChanges = true;
};


Slider.prototype._onLinkChange = function (value) {
    this._updateHandle(value);
    this._value = value;
    this.emit('change', value || 0);
};


Slider.prototype._updateHandle = function (value) {
    this.elementHandle.style.left = (Math.max(0, Math.min(1, ((value || 0) - this._min) / (this._max - this._min))) * 100) + '%';
};


Slider.prototype._onMouseDown = function (evt) {
    if (evt.button !== 0 || this.ui.disabled)
        return;

    this.ui._onSlideStart(evt.pageX);
};


Slider.prototype._onTouchStart = function (evt) {
    if (this.ui.disabled)
        return;

    for (var i = 0; i < evt.changedTouches.length; i++) {
        var touch = evt.changedTouches[i];
        if (!touch.target.ui || touch.target.ui !== this.ui)
            continue;

        this.ui.evtTouchId = touch.identifier;
        this.ui._onSlideStart(touch.pageX);
        break;
    }
};


Slider.prototype._onSlideStart = function (pageX) {
    this.elementHandle.focus();

    this.renderChanges = false;

    if (this.evtTouchId === null) {
        window.addEventListener('mousemove', this.evtMouseMove, false);
        window.addEventListener('mouseup', this.evtMouseUp, false);
    } else {
        window.addEventListener('touchmove', this.evtTouchMove, false);
        window.addEventListener('touchend', this.evtTouchEnd, false);
    }

    this.class.add('active');

    this.emit('start', this.value);

    this._onSlideMove(pageX);

    if (this._link && this._link.history)
        this._link.history.combine = true;
};


Slider.prototype._onSlideMove = function (pageX) {
    var rect = this.element.getBoundingClientRect();
    var x = Math.max(0, Math.min(1, (pageX - rect.left) / rect.width));

    var range = this._max - this._min;
    var value = (x * range) + this._min;
    value = parseFloat(value.toFixed(this.precision), 10);

    this._updateHandle(value);
    this.value = value;
};


Slider.prototype._onSlideEnd = function (pageX) {
    this._onSlideMove(pageX);

    this.renderChanges = true;

    this.class.remove('active');

    if (this.evtTouchId === null) {
        window.removeEventListener('mousemove', this.evtMouseMove);
        window.removeEventListener('mouseup', this.evtMouseUp);
    } else {
        window.removeEventListener('touchmove', this.evtTouchMove);
        window.removeEventListener('touchend', this.evtTouchEnd);
    }

    if (this._link && this._link.history)
        this._link.history.combine = false;

    this.emit('end', this.value);
};


Object.defineProperty(Slider.prototype, 'min', {
    get: function () {
        return this._min;
    },
    set: function (value) {
        if (this._min === value)
            return;

        this._min = value;
        this._updateHandle(this._value);
    }
});


Object.defineProperty(Slider.prototype, 'max', {
    get: function () {
        return this._max;
    },
    set: function (value) {
        if (this._max === value)
            return;

        this._max = value;
        this._updateHandle(this._value);
    }
});


Object.defineProperty(Slider.prototype, 'value', {
    get: function () {
        if (this._link) {
            return this._link.get(this.path);
        }
        return this._value;

    },
    set: function (value) {
        if (this._link) {
            if (!this._link.set(this.path, value))
                this._updateHandle(this._link.get(this.path));
        } else {
            if (this._max !== null && this._max < value)
                value = this._max;

            if (this._min !== null && this._min > value)
                value = this._min;

            if (value === null) {
                this.class.add('null');
            } else {
                if (typeof value !== 'number')
                    value = undefined;

                value = (value !== undefined && this.precision !== null) ? parseFloat(value.toFixed(this.precision), 10) : value;
                this.class.remove('null');
            }

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
