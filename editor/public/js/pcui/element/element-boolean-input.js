Object.assign(pcui, (function () {
    'use strict';

    const CLASS_BOOLEAN_INPUT = 'pcui-boolean-input';
    const CLASS_BOOLEAN_INPUT_TICKED = CLASS_BOOLEAN_INPUT + '-ticked';
    const CLASS_BOOLEAN_INPUT_TOGGLE = CLASS_BOOLEAN_INPUT + '-toggle';

    /**
     * @name pcui.BooleanInput
     * @classdesc A checkbox element.
     * @property {Boolean} renderChanges If true the input will flash when changed.
     * @extends pcui.Element
     */
    class BooleanInput extends pcui.Element {
        /**
         * Creates a new pcui.BooleanInput.
         * @param {Object} args The arguments.
         * @param {String} [args.type] The type of checkbox currently can be null or 'toggle'.
         */
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('div'), args);

            if (args.type === 'toggle') {
                this.class.add(CLASS_BOOLEAN_INPUT_TOGGLE);
            } else {
                this.class.add(CLASS_BOOLEAN_INPUT);
            }
            this.class.add(pcui.CLASS_NOT_FLEXIBLE);

            this.dom.tabIndex = 0;

            this._domEventKeyDown = this._onKeyDown.bind(this);
            this._domEventFocus = this._onFocus.bind(this);
            this._domEventBlur = this._onBlur.bind(this);

            this.dom.addEventListener('keydown', this._domEventKeyDown);
            this.dom.addEventListener('focus', this._domEventFocus);
            this.dom.addEventListener('blur', this._domEventBlur);

            this._value = null;
            if (args.value !== undefined) {
                this.value = args.value;
            }

            this.renderChanges = args.renderChanges;
        }

        _onClick(evt) {
            if (this.enabled && !this.readOnly) {
                this.value = !this.value;
                this.blur();
            }

            return super._onClick(evt);
        }

        _onKeyDown(evt) {
            if (evt.keyCode === 27) {
                this.blur();
                return;
            }

            if (!this.enabled || this.readOnly) return;

            if (evt.keyCode === 32) {
                evt.stopPropagation();
                evt.preventDefault();
                this.value = !this.value;
            }
        }

        _onFocus() {
            this.emit('focus');
        }

        _onBlur() {
            this.emit('blur');
        }

        _updateValue(value) {
            if (value === this.value) return false;

            this._value = value;

            if (value) {
                this.class.add(CLASS_BOOLEAN_INPUT_TICKED);
            } else {
                this.class.remove(CLASS_BOOLEAN_INPUT_TICKED);
            }

            if (this.renderChanges) {
                this.flash();
            }

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            this.emit('change', value);

            return true;
        }

        focus() {
            this.dom.focus();
        }

        blur() {
            this.dom.blur();
        }

        destroy() {
            if (this._destroyed) return;

            this.dom.removeEventListener('keydown', this._domEventKeyDown);
            this.dom.removeEventListener('focus', this._domEventFocus);
            this.dom.removeEventListener('blur', this._domEventBlur);

            super.destroy();
        }

        get value() {
            return this._value;
        }

        set value(value) {
            const changed = this._updateValue(value);
            if (changed && this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            let different = false;
            const value = values[0];
            for (let i = 1; i < values.length; i++) {
                if (values[i] !== value) {
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
    }


    utils.implements(BooleanInput, pcui.IBindable);
    utils.implements(BooleanInput, pcui.IFocusable);

    return {
        BooleanInput: BooleanInput
    };
})());
