"use strict";

function NumberField(args) {
    ui.Element.call(this);
    args = args || { };

    this.precision = (args.precision != null) ? args.precision : null;
    this.step = (args.step != null) ? args.step : ((args.precision != null) ? 1 / Math.pow(10, args.precision) : 1);

    this.max = (args.max !== null) ? args.max : null;
    this.min = (args.min !== null) ? args.min : null;

    this.element = document.createElement('input');
    this.element.classList.add('ui-number-field');
    this.element.type = 'text';

    if (args.default !== undefined) {
        this.value = args.default;
    }

    this.element.addEventListener('change', this._onChange.bind(this), false);
    // this.element.addEventListener('mousedown', this._onMouseDown.bind(this), false);
    // this.element.addEventListener('mousewheel', this._onMouseDown.bind(this), false);

    this._lastValue = this.value;
    this._mouseMove = null;
    this._dragging = false;
    this._dragDiff = 0;
    this._dragStart = 0;

    this.on('disable', function() {
        this.element.disabled = true;
    });
    this.on('enable', function() {
        this.element.disabled = false;
    });
}
NumberField.prototype = Object.create(ui.Element.prototype);

NumberField.prototype._onLinkChange = function(value) {
    this.element.value = value || 0;
    this.emit('change', value || 0);
};

NumberField.prototype._onChange = function() {
    var value = parseFloat(this.element.value, 10) || 0;
    this.element.value = value;
    this.value = value;
};

// NumberField.prototype._onMouseDown = function(evt) {
//     if (evt.button !== 0) return;

//     this._mouseY = evt.clientY;
//     this._dragStart = this.value;

//     this._mouseMove = this._onMouseMove.bind(this);
//     this._mouseUp = this._onMouseUp.bind(this);
//     window.addEventListener('mousemove', this._mouseMove, false);
//     window.addEventListener('mouseup', this._mouseUp, false);

//     evt.preventDefault();
//     evt.stopPropagation();
// };


// NumberField.prototype._onMouseUp = function(evt) {
//     this._dragging = false;
//     this.element.disabled = false;
//     this.element.focus();
//     this.element.classList.remove('noSelect', 'active');
//     document.body.classList.remove('noSelect');

//     if (this._mouseMove) {
//         window.removeEventListener('mousemove', this._mouseMove);
//         this._mouseMove = null;
//     }
//     if (this._mouseUp) {
//         window.removeEventListener('mouseup', this._mouseUp);
//         this._mouseUp = null;
//     }

//     evt.preventDefault();
//     evt.stopPropagation();
// };

// NumberField.prototype._onMouseMove = function(evt) {
//     if (this._mouseMove === null) return;
//     if (! this._dragging) {
//         if (Math.abs(evt.clientY - this._mouseY) > 16) {
//             this._dragging = true;
//         } else {
//             return;
//         }
//         this._mouseY = evt.clientY;
//         this.element.disabled = true;
//         this.element.blur();
//         this.element.classList.add('noSelect', 'active');
//         document.body.classList.add('noSelect');
//     }

//     this._dragDiff = this._mouseY - evt.clientY;

//     if (this.step !== 1)
//         this._dragDiff *= this.step;

//     if (this.precision !== null)
//         this._dragDiff = parseFloat(this._dragDiff.toFixed(this.precision));

//     this.value = this._dragStart + this._dragDiff;

//     evt.preventDefault();
//     evt.stopPropagation();
// };

Object.defineProperty(NumberField.prototype, 'value', {
    get: function() {
        if (this._link) {
            return this._link.get(this.path);
        } else {
            return parseFloat(this.element.value, 10);
        }
    },
    set: function(value) {
        if (this._link) {
            if (! this._link.set(this.path, value)) {
                this.element.value = this._link.get(this.path);
            }
        } else {
            if (this.max !== null && this.max < value)
                value = this.max;

            if (this.min !== null && this.min > value)
                value = this.min;

            value = (this.precision !== null) ? parseFloat(value.toFixed(this.precision), 10) : value;
            this.element.value = value;

            if (this._lastValue !== value) {
                this._lastValue = value;
                this.emit('change', parseFloat(value, 10));
            }
        }
    }
});


window.ui.NumberField = NumberField;
