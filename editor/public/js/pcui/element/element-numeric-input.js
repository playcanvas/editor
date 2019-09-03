Object.assign(pcui, (function () {
    'use strict';

    const CLASS_NUMERIC_INPUT = 'pcui-numeric-input';

    /**
     * @name pcui.NumericInput
     * @classdesc The NumericInput represents an input element that holds numbers.
     * @property {Number} min Gets / sets the minimum value this field can take.
     * @property {Number} max Gets / sets the maximum value this field can take.
     * @property {Number} precision Gets / sets the maximum number of decimals a value can take.
     * @property {Number} step Gets / sets the amount that the value will be increased or decreased when using the arrow keys. Holding Shift will use 10x the step.
     * @extends pcui.TextInput
     */
    class NumericInput extends pcui.TextInput {
        /**
         * Creates a new NumericInput.
         * @param {Object} args The arguments. Extends the pcui.TextInput constructor arguments.
         * @param {Boolean} [args.allowNull] Gets / sets whether the value can be null. If not then it will be 0 instead of null.
         */
        constructor(args) {
            // make copy of args
            args = Object.assign({}, args);
            const value = args.value;
            // delete value because we want to set it after
            // the other arguments
            delete args.value;

            super(args);

            this.class.add(CLASS_NUMERIC_INPUT);

            this._min = args.min !== undefined ? args.min : null;
            this._max = args.max !== undefined ? args.max : null;
            this._precision = args.precision !== undefined ? args.precision : null;
            this._allowNull = args.allowNull || false;
            this._step = args.step !== undefined ? args.step : 1;
            this._oldValue = undefined;
            this.value = value;
        }

        _onInputChange(evt) {
            // get the content of the input and pass it
            // through our value setter
            this.value = this._domInput.value;
        }

        _onInputKeyDown(evt) {
            if (!this.enabled || this.readOnly) return super._onInputKeyDown(evt);

            // increase / decrease value with arrow keys
            if (evt.keyCode === 38 || evt.keyCode === 40) {
                const inc = (evt.shiftKey ? 10 : 1) * (evt.keyCode === 40 ? -1 : 1);
                this.value = this.value + this.step * inc;
                return;
            }

            super._onInputKeyDown(evt);
        }

        _normalizeValue(value) {
            if (value === undefined) {
                value = null;
            }

            value = parseFloat(value, 10);
            if (!isNaN(value)) {
                // clamp between min max
                if (this.min !== null && value < this.min) {
                    value = this.min;
                }
                if (this.max !== null && value > this.max) {
                    value = this.max;
                }

                // fix precision
                if (this.precision !== null) {
                    value = parseFloat(value.toFixed(this.precision), 10);
                }
            } else if (this._allowNull) {
                value = null;
            } else {
                value = 0;
            }

            return value;
        }

        _updateValue(value) {
            const different = (value !== this._oldValue);

            // always set the value to the input because
            // we always want it to show an actual number or nothing
            this._oldValue = value;
            this._domInput.value = value;

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            if (different) {
                this.emit('change', value);
            }

            return different;
        }

        get value() {
            const val = super.value;
            return val !== '' ? parseFloat(val, 10) : null;
        }

        set value(value) {
            value = this._normalizeValue(value);

            const changed = this._updateValue(value);

            if (changed && this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            let different = false;
            const value = this._normalizeValue(values[0]);
            for (let i = 1; i < values.length; i++) {
                if (value !== this._normalizeValue(values[i])) {
                    different = true;
                    break;
                }
            }

            if (different) {
                this._updateValue(null);
                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this._updateValue(values[0]);
            }
        }

        get min() {
            return this._min;
        }

        set min(value) {
            if (this._min === value) return;
            this._min = value;

            // reset value
            if (this._min !== null) {
                this.value = this.value;
            }
        }

        get max() {
            return this._max;
        }

        set max(value) {
            if (this._max === value) return;
            this._max = value;

            // reset value
            if (this._max !== null) {
                this.value = this.value;
            }
        }

        get precision() {
            return this._precision;
        }

        set precision(value) {
            if (this._precision === value) return;
            this._precision = value;

            // reset value
            if (this._precision !== null) {
                this.value = this.value;
            }
        }

        get step() {
            return this._step;
        }

        set step(value) {
            this._step = value;
        }
    }

    return {
        NumericInput: NumericInput
    };
})());
