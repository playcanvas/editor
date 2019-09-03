Object.assign(pcui, (function () {
    'use strict';

    const CLASS_VECTOR_INPUT = 'pcui-vector-input';

    /**
     * @name pcui.VectorInput
     * @classdesc A vector input
     * @extends pcui.Element
     */
    class VectorInput extends pcui.Element {
        /**
         * Creates a new pcui.VectorInput.
         * @param {Object} args The arguments.
         * @param {Number} [args.dimensions] The number of dimensions in the vector. Can be between 2 to 4. Defaults to 3.
         * @param {Number} [args.min] The minimum value for each vector element.
         * @param {Number} [args.max] The maximum value for each vector element.
         * @param {Number} [args.precision] The decimal precision for each vector element.
         * @param {Number} [args.step] The incremental step when using arrow keys for each vector element.
         * @param {Boolean} [args.renderChanges] If true each vector element will flash on changes.
         * @param {String[]|String} [args.placeholder] The placeholder string for each vector element.
         */
        constructor(args) {
            args = Object.assign({}, args);

            // set binding after inputs have been created
            const binding = args.binding;
            delete args.binding;

            super(document.createElement('div'), args);

            this.class.add(CLASS_VECTOR_INPUT);

            const dimensions = Math.max(2, Math.min(4, args.dimensions || 3));

            const onInputChange = this._onInputChange.bind(this);
            this._inputs = new Array(dimensions);
            for (let i = 0; i < this._inputs.length; i++) {
                this._inputs[i] = new pcui.NumericInput({
                    min: args.min,
                    max: args.max,
                    precision: args.precision,
                    step: args.step,
                    renderChanges: args.renderChanges,
                    placeholder: args.placeholder ? (Array.isArray(args.placeholder) ? args.placeholder[i] : args.placeholder) : null
                });
                this._inputs[i].on('change', onInputChange);
                this._inputs[i].on('focus', () => {
                    this.emit('focus');
                });
                this._inputs[i].on('blur', () => {
                    this.emit('blur');
                });
                this.dom.appendChild(this._inputs[i].dom);
                this._inputs[i].parent = this;
            }

            // set the binding after the inputs have been created
            // because we rely on them in the overriden setter
            if (binding) {
                this.binding = binding;
            }

            this._applyingChange = false;

            if (args.value !== undefined) {
                this.value = args.value;
            }

        }

        _onInputChange() {
            if (this._applyingChange) return;

            this.emit('change', this.value);
        }

        _updateValue(value) {
            if (this.value.equals(value)) return false;

            this._applyingChange = true;

            for (let i = 0; i < this._inputs.length; i++) {
                // disable binding for each individual input when we use
                // the 'value' setter for the whole vector value. That is because
                // we do not want the individual inputs to emit their own binding events
                // since we are setting the whole vector value here
                const binding = this._inputs[i].binding;
                let applyingChange = false;
                if (binding) {
                    applyingChange = binding.applyingChange;
                    binding.applyingChange = true;
                }
                this._inputs[i].value = value[i] !== undefined ? value[i] : null;
                if (binding) {
                    binding.applyingChange = applyingChange;
                }
            }

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            this.emit('change', this.value);

            this._applyingChange = false;

            return true;
        }

        link(observers, paths) {
            super.link(observers, paths);
            observers = Array.isArray(observers) ? observers : [observers];
            paths = Array.isArray(paths) ? paths : [paths];

            const useSinglePath = paths.length === 1 || observers.length !== paths.length;
            if (useSinglePath) {
                for (let i = 0; i < this._inputs.length; i++) {
                    // link observers to path.i for each dimension
                    this._inputs[i].link(observers, paths[0] + `.${i}`);
                }
            } else {
                for (let i = 0; i < this._inputs.length; i++) {
                    // link observers to paths[i].i for each dimension
                    this._inputs[i].link(observers, paths.map(path => `${path}.${i}`));
                }

            }
        }

        unlink() {
            super.unlink();
            for (let i = 0; i < this._inputs.length; i++) {
                this._inputs[i].unlink();
            }
        }

        focus() {
            this._inputs[0].focus();
        }

        blur() {
            for (let i = 0; i < this._inputs.length; i++) {
                this._inputs[i].blur();
            }
        }

        get value() {
            const value = new Array(this._inputs.length);
            for (let i = 0; i < this._inputs.length; i++) {
                value[i] = this._inputs[i].value;
            }

            return value;
        }

        set value(value) {
            if (!Array.isArray(value)) {
                value = [];
            }

            const changed = this._updateValue(value);

            if (changed && this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            let different = false;
            const value = values[0] || [];
            for (let i = 1; i < values.length; i++) {
                if (!value.equals(values[i])) {
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

        // override binding setter to set a binding clone to
        // each input
        set binding(value) {
            super.binding = value;
            for (let i = 0; i < this._inputs.length; i++) {
                this._inputs[i].binding = value ? value.clone() : null;
            }
        }

        // we have to override the getter too because
        // we have overriden the setter
        get binding() {
            return super.binding;
        }

        get placeholder() {
            return this._inputs.map(input => input.placeholder);
        }

        set placeholder(value) {
            for (let i = 0; i < this._inputs.length; i++) {
                this._inputs[i].placeholder = value[i] || value || null;
            }
        }

        get inputs() {
            return this._inputs.slice();
        }
    }

    // add proxied properties
    [
        'min',
        'max',
        'precision',
        'step',
        'renderChanges'
    ].forEach(property => {
        Object.defineProperty(VectorInput.prototype, property, {
            get: function () {
                return this._inputs[0][property];
            },
            set: function (value) {
                for (let i = 0; i < this._inputs.length; i++) {
                    this._inputs[i][property] = value;
                }
            }
        });
    });

    utils.implements(VectorInput, pcui.IBindable);
    utils.implements(VectorInput, pcui.IFocusable);

    return {
        VectorInput: VectorInput
    };
})());
