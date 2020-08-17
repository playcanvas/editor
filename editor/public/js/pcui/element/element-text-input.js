Object.assign(pcui, (function () {
    'use strict';

    const CLASS_TEXT_INPUT = 'pcui-text-input';

    /**
     * @name pcui.TextInput
     * @classdesc The TextInput is an input element of type text.
     * @extends pcui.Element
     * @mixes pcui.IBindable
     * @mixes pcui.IFocusable
     * @property {String} placeholder Gets / sets the placeholder label that appears on the right of the input.
     * @property {HTMLElement} input Gets the HTML input element.
     * @property {Boolean} renderChanges If true then the TextInput will flash when its text changes.
     * @property {Boolean} blurOnEnter Gets / sets whether pressing Enter will blur (unfocus) the field. Defaults to true.
     * @property {Boolean} blurOnEscape Gets / sets whether pressing Escape will blur (unfocus) the field. Defaults to true.
     * @property {Boolean} keyChange Gets / sets whether any key up event will cause a change event to be fired.} args
     * @property {Function} onValidate A function that validates the value that is entered into the input and returns true if it is valid or false otherwise.
     * If false then the input will be set in an error state and the value will not propagate to the binding.
     */
    class TextInput extends pcui.Element {
        /**
         * Creates a new TextInput.
         * @param {Object} args The arguments. Extends the pcui.Element constructor arguments. All settable properties can also be set through the constructor.
         */
        constructor(args) {
            if (!args) args = {};
            super(document.createElement('div'), args);

            this.class.add(CLASS_TEXT_INPUT);

            let input = args.input;
            if (!input) {
                input = document.createElement('input');
                input.ui = this;
                input.type = 'text';
                input.tabIndex = 0;
            }
            this._domInput = input;

            this._domEvtChange = this._onInputChange.bind(this);
            this._domEvtFocus = this._onInputFocus.bind(this);
            this._domEvtBlur = this._onInputBlur.bind(this);
            this._domEvtKeyDown = this._onInputKeyDown.bind(this);
            this._domEvtKeyUp = this._onInputKeyUp.bind(this);
            this._domEvtCtxMenu = this._onInputCtxMenu.bind(this);

            this._domInput.addEventListener('change', this._domEvtChange);
            this._domInput.addEventListener('focus', this._domEvtFocus);
            this._domInput.addEventListener('blur', this._domEvtBlur);
            this._domInput.addEventListener('keydown', this._domEvtKeyDown);
            this._domInput.addEventListener('contextmenu', this._domEvtCtxMenu, false);
            this.dom.appendChild(this._domInput);

            this._suspendInputChangeEvt = false;

            if (args.value !== undefined) {
                this.value = args.value;
            }
            this.placeholder = args.placeholder || null;
            this.renderChanges = args.renderChanges || false;
            this.blurOnEnter = (args.blurOnEnter !== undefined ? args.blurOnEnter : true);
            this.blurOnEscape = (args.blurOnEscape !== undefined ? args.blurOnEscape : true);
            this.keyChange = args.keyChange || false;

            if (args.onValidate) {
                this.onValidate = args.onValidate;
            }

            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });

            this.on('disable', this._updateInputReadOnly.bind(this));
            this.on('enable', this._updateInputReadOnly.bind(this));
            this.on('readOnly', this._updateInputReadOnly.bind(this));
            this._updateInputReadOnly();
        }

        _onInputChange(evt) {
            if (this._suspendInputChangeEvt) return;

            if (this._onValidate) {
                const error = !this._onValidate(this.value);
                this.error = error;
                if (error) {
                    return;
                }
            } else {
                this.error = false;
            }

            this.emit('change', this.value);

            if (this._binding) {
                this._binding.setValue(this.value);
            }
        }

        _onInputFocus(evt) {
            this.class.add(pcui.CLASS_FOCUS);
            this.emit('focus', evt);
        }

        _onInputBlur(evt) {
            this.class.remove(pcui.CLASS_FOCUS);
            this.emit('blur', evt);
        }

        _onInputKeyDown(evt) {
            if ((evt.keyCode === 27 && this.blurOnEscape) || (evt.keyCode === 13 && this.blurOnEnter)) {
                this._domInput.blur();
            }

            this.emit('keydown', evt);
        }

        _onInputKeyUp(evt) {
            this._onInputChange(evt);

            this.emit('keyup', evt);
        }

        _onInputCtxMenu(evt) {
            this._domInput.select();
        }

        _updateInputReadOnly() {
            const readOnly = !this.enabled || this.readOnly;
            if (readOnly) {
                this._domInput.setAttribute('readonly', true);
            } else {
                this._domInput.removeAttribute('readonly');
            }
        }

        _updateValue(value) {
            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            if (value && typeof(value) === 'object') {
                if (Array.isArray(value)) {
                    let isObject = false;
                    for (let i = 0; i < value.length; i++) {
                        if (value[i] && typeof value[i] === 'object') {
                            isObject = true;
                            break;
                        }
                    }

                    value = isObject ? '[Not available]' : value.map(val => val === null ? 'null' : val).join(',');
                } else {
                    value = '[Not available]';
                }
            }

            if (value === this.value) return false;

            this._suspendInputChangeEvt = true;
            this._domInput.value = (value === null || value === undefined) ? '' : value;
            this._suspendInputChangeEvt = false;

            this.emit('change', value);

            return true;
        }

        /**
         * @name pcui.TextInput#focus
         * @description Focuses the Element.
         * @param {Boolean} select If true then this will also select the text after focusing.
         */
        focus(select) {
            this._domInput.focus();
            if (select) {
                this._domInput.select();
            }
        }

        /**
         * @name pcui.TextInput#blur
         * @description Blurs (unfocuses) the Element.
         */
        blur() {
            this._domInput.blur();
        }

        destroy() {
            if (this._destroyed) return;
            this._domInput.removeEventListener('change', this._domEvtChange);
            this._domInput.removeEventListener('focus', this._domEvtFocus);
            this._domInput.removeEventListener('blur', this._domEvtBlur);
            this._domInput.removeEventListener('keydown', this._domEvtKeyDown);
            this._domInput.removeEventListener('keyup', this._domEvtKeyUp);
            this._domInput.removeEventListener('contextmenu', this._domEvtCtxMenu);
            this._domInput = null;

            super.destroy();
        }

        get value() {
            return this._domInput.value;
        }

        set value(value) {
            const changed = this._updateValue(value);

            if (changed) {
                // reset error
                this.error = false;
            }

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

        get placeholder() {
            return this.dom.getAttribute('placeholder');
        }

        set placeholder(value) {
            if (value) {
                this.dom.setAttribute('placeholder', value);
            } else {
                this.dom.removeAttribute('placeholder');
            }
        }

        get keyChange() {
            return this._keyChange;
        }

        set keyChange(value) {
            if (this._keyChange === value) return;

            this._keyChange = value;
            if (value) {
                this._domInput.addEventListener('keyup', this._domEvtKeyUp);
            } else {
                this._domInput.removeEventListener('keyup', this._domEvtKeyUp);
            }
        }

        get input() {
            return this._domInput;
        }

        get onValidate() {
            return this._onValidate;
        }

        set onValidate(value) {
            this._onValidate = value;
        }
    }

    utils.implements(TextInput, pcui.IBindable);
    utils.implements(TextInput, pcui.IFocusable);

    pcui.Element.register('string', TextInput, { renderChanges: true });

    return {
        TextInput: TextInput
    };
})());
