"use strict";

function Slider(args) {
    ui.Element.call(this);
    args = args || { };

    this._value = 0;

    this.precision = isNaN(args.precision) ? 2 : args.precision;
    this.min = isNaN(args.min) ? 0 : args.min;
    this.max = isNaN(args.max) ? 1 : args.max;

    this.element = document.createElement('div');
    this.element.classList.add('ui-slider');

    this.elementBar = document.createElement('div');
    this.elementBar.classList.add('bar');
    this.element.appendChild(this.elementBar);

    this.elementHandle = document.createElement('div');
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
}
Slider.prototype = Object.create(ui.Element.prototype);


Slider.prototype._onLinkChange = function(value) {
    this._updateHandle(value);
    this._value = value;
    this.emit('change', value || 0);
};


Slider.prototype._updateHandle = function(value) {
    this.elementHandle.style.left = (Math.max(0, Math.min(1, value / (this.max - this.min))) * 100) + '%';
};


Slider.prototype._handleEvt = function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var rect = this.element.getBoundingClientRect();
    var x = Math.max(0, Math.min(1, (evt.clientX - rect.left) / rect.width));

    var range = this.max - this.min;
    var value = (x * range);
    value = parseFloat(value.toFixed(this.precision), 10);

    this._updateHandle(value);
    this.value = value;
};


Slider.prototype._onMouseDown = function(evt) {
    if (evt.button !== 0)
        return;

    this.renderChanges = false;

    this.evtMouseMove = this._onMouseMove.bind(this);
    window.addEventListener('mousemove', this.evtMouseMove, false);

    this.evtMouseUp = this._onMouseUp.bind(this);
    window.addEventListener('mouseup', this.evtMouseUp, false);

    this.class.add('active');

    this._handleEvt(evt);
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
};



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
            if (this.max !== null && this.max < value)
                value = this.max;

            if (this.min !== null && this.min > value)
                value = this.min;

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
