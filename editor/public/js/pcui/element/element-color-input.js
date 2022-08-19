Object.assign(pcui, (function () {
    'use strict';

    const CLASS_COLOR_INPUT = 'pcui-color-input';

    /**
     * @name pcui.ColorInput
     * @classdesc Represents a color input. Clicking on the color input will open a color picker.
     * @property {number[]} value An array of 1 to 4 numbers that range from 0 to 1. The length of the array depends on the number of channels.
     * @property {number} channels Can be 1 to 4.
     * @property {boolean} renderChanges If true the input will flash when changed.
     * @mixes pcui.IBindable
     * @mixes pcui.IFocusable
     */
    class ColorInput extends pcui.Element {
        /**
         * Creates a new ColorInput.
         *
         * @param {object} args - The arguments. Extends the pcui.Element arguments. Any settable property can also be set through the constructor.
         */
        constructor(args) {
            args = Object.assign({
                tabIndex: 0
            }, args);

            super(document.createElement('div'), args);

            this.class.add(CLASS_COLOR_INPUT);
            this.class.add(pcui.CLASS_NOT_FLEXIBLE);

            // this element shows the actual color. The
            // parent element shows the checkerboard pattern
            this._domColor = document.createElement('div');
            this.dom.appendChild(this._domColor);

            this._domEventKeyDown = this._onKeyDown.bind(this);
            this._domEventFocus = this._onFocus.bind(this);
            this._domEventBlur = this._onBlur.bind(this);

            this.dom.addEventListener('keydown', this._domEventKeyDown);
            this.dom.addEventListener('focus', this._domEventFocus);
            this.dom.addEventListener('blur', this._domEventBlur);

            this.on('click', () => {
                if (!this.enabled || this.readOnly) return;
                this._openColorPicker();
            });

            this._historyCombine = false;
            this._historyPostfix = null;

            this._value = args.value || [0, 0, 0, 1];
            this._channels = args.channels || 3;
            this._setValue(this._value);

            this._isColorPickerOpen = false;

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });
        }

        focus() {
            this.dom.focus();
        }

        blur() {
            this.dom.blur();
        }

        _onKeyDown(evt) {
            // escape blurs the field
            if (evt.keyCode === 27) {
                this.blur();
            }

            // enter opens the color picker
            if (evt.keyCode !== 13 || !this.enabled || this.readOnly) {
                return;
            }

            evt.stopPropagation();
            evt.preventDefault();

            this._openColorPicker();
        }

        _onFocus(evt) {
            this.emit('focus');
        }

        _onBlur(evt) {
            this.emit('blur');
        }

        _openColorPicker() {
            // TODO - this needs to open the picker
            // without relying on the editor global methods
            this._isColorPickerOpen = true;

            // open color picker
            editor.call('picker:color', this.value.map(c => Math.floor(c * 255)));

            // picked color
            let evtColorPick = editor.on('picker:color', (color) => {
                this.value = color.map(c => c / 255);
            });

            let evtColorPickStart = editor.on('picker:color:start', () => {
                if (this.binding) {
                    this._historyCombine = this.binding.historyCombine;
                    this._historyPostfix = this.binding.historyPostfix;

                    this.binding.historyCombine = true;

                    // assign a history postfix which will limit how far back
                    // the history will be combined. We only want to combine
                    // history between this picker:color:start and picker:color:end events
                    // not further back
                    this._binding.historyPostfix = `(${Date.now()})`;

                } else {
                    this._historyCombine = false;
                    this._historyPostfix = null;
                }
            });

            let evtColorPickEnd = editor.on('picker:color:end', () => {
                if (this.binding) {
                    this.binding.historyCombine = this._historyCombine;
                    this.binding.historyPostfix = this._historyPostfix;
                }
            });

            // position picker
            const rectPicker = editor.call('picker:color:rect');
            const rectElement = this.dom.getBoundingClientRect();
            editor.call('picker:color:position', rectElement.left - rectPicker.width, rectElement.top);

            // color changed, update picker
            let evtColorToPicker = this.on('change', () => {
                editor.call('picker:color:set', this.value.map(c => Math.floor(c * 255)));
            });

            // picker closed
            editor.once('picker:color:close', () => {
                evtColorPick.unbind();
                evtColorPick = null;

                evtColorToPicker.unbind();
                evtColorToPicker = null;

                evtColorPickStart.unbind();
                evtColorPickStart = null;

                evtColorPickEnd.unbind();
                evtColorPickEnd = null;

                this._isColorPickerOpen = false;
                this.focus();
            });
        }

        _valueToColor(value) {
            value = Math.floor(value * 255);
            return Math.max(0, Math.min(value, 255));

        }

        _setValue(value) {
            const r = this._valueToColor(value[0]);
            const g = this._valueToColor(value[1]);
            const b = this._valueToColor(value[2]);
            const a = value[3];

            if (this._channels === 1) {
                this._domColor.style.backgroundColor = `rgb(${r}, ${r}, ${r})`;
            } else if (this._channels === 3) {
                this._domColor.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            } else if (this._channels === 4) {
                this._domColor.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;
            }
        }

        _updateValue(value) {
            let dirty = false;
            for (let i = 0; i < value.length; i++) {
                if (this._value[i] !== value[i]) {
                    dirty = true;
                    this._value[i] = value[i];
                }
            }

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            if (dirty) {
                this._setValue(value);

                this.emit('change', value);
            }

            return dirty;
        }

        destroy() {
            if (this._destroyed) return;
            this.dom.removeEventListener('keydown', this._domEventKeyDown);
            this.dom.removeEventListener('focus', this._domEventFocus);
            this.dom.removeEventListener('blur', this._domEventBlur);
            super.destroy();
        }

        get value() {
            return this._value.slice(0, this._channels);
        }

        set value(value) {
            value = value || [0, 0, 0, 0];
            const changed = this._updateValue(value);

            if (changed && this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) {
            let different = false;
            const value = values[0];
            for (let i = 1; i < values.length; i++) {
                if (Array.isArray(value)) {
                    if (!value.equals(values[i])) {
                        different = true;
                        break;
                    }
                } else {
                    if (value !== values[i]) {
                        different = true;
                        break;
                    }
                }
            }

            if (different) {
                this.value = null;
                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this.value = values[0];
            }
        }

        get channels() {
            return this._channels;
        }

        set channels(value) {
            if (this._channels === value) return;
            this._channels = Math.max(0, Math.min(value, 4));
            this._setValue(this.value);
        }
    }

    utils.implements(ColorInput, pcui.IBindable);
    utils.implements(ColorInput, pcui.IFocusable);

    pcui.Element.register('rgb', ColorInput, { channels: 3, renderChanges: true });
    pcui.Element.register('rgba', ColorInput, { channels: 4, renderChanges: true });

    return {
        ColorInput: ColorInput
    };
})());
