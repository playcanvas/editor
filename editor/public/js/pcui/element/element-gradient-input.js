Object.assign(pcui, (function () {
    'use strict';

    const REGEX_KEYS = /keys/;
    const REGEX_TYPE = /type/;
    const CLASS_GRADIENT = 'pcui-gradient';

    function createCheckerboardPattern(context) {
        // create checkerboard pattern
        const canvas = document.createElement('canvas');
        const size = 24;
        const halfSize = size / 2;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#';
        ctx.fillStyle = "#949a9c";
        ctx.fillRect(0, 0, halfSize, halfSize);
        ctx.fillRect(halfSize, halfSize, halfSize, halfSize);
        ctx.fillStyle = "#657375";
        ctx.fillRect(halfSize, 0, halfSize, halfSize);
        ctx.fillRect(0, halfSize, halfSize, halfSize);

        return context.createPattern(canvas, 'repeat');
    }

    /**
     * @name pcui.GradientInput
     * @classdesc Shows a color gradient.
     * @property {boolean} renderChanges If true the input will flash when changed.
     * @augments pcui.Element
     */
    class GradientInput extends pcui.Element {
        /**
         * Creates a new pcui.GradientInput.
         *
         * @param {object} args - The arguments.
         * @param {number} [args.channels] - The number of color channels. Between 1 and 4.
         */
        constructor(args) {
            args = Object.assign({
                tabIndex: 0
            }, args);

            super(document.createElement('div'), args);

            this.class.add(CLASS_GRADIENT);

            this._canvas = new pcui.Canvas({ useDevicePixelRatio: true });
            this.dom.appendChild(this._canvas.dom);
            this._canvas.parent = this;
            this._canvas.on('resize', this._renderGradient.bind(this));

            this._checkerboardPattern = createCheckerboardPattern(this._canvas.dom.getContext('2d'));

            // make sure canvas is the same size as the container element
            // 20 times a second
            this._resizeInterval = setInterval(() => {
                this._canvas.resize(this.width, this.height);
            }, 1000 / 20);

            this._domEventKeyDown = this._onKeyDown.bind(this);
            this._domEventFocus = this._onFocus.bind(this);
            this._domEventBlur = this._onBlur.bind(this);

            this.dom.addEventListener('keydown', this._domEventKeyDown);
            this.dom.addEventListener('focus', this._domEventFocus);
            this.dom.addEventListener('blur', this._domEventBlur);

            this.on('click', () => {
                if (!this.enabled || this.readOnly || this.class.contains(pcui.CLASS_MULTIPLE_VALUES)) return;
                this._openGradientPicker();
            });

            this._channels = args.channels || 3;
            this._value = null;
            if (args.value) {
                this.value = args.value;
            }

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });
        }

        _onKeyDown(evt) {
            // escape blurs the field
            if (evt.keyCode === 27) {
                this.blur();
            }

            // enter opens the gradient picker
            if (evt.keyCode !== 13 || !this.enabled || this.readOnly || this.class.contains(pcui.CLASS_MULTIPLE_VALUES)) {
                return;
            }

            evt.stopPropagation();
            evt.preventDefault();

            this._openGradientPicker();
        }

        _onFocus(evt) {
            this.emit('focus');
        }

        _onBlur(evt) {
            this.emit('blur');
        }

        _getDefaultValue() {
            return {
                type: 4,
                keys: (new Array(this._channels)).fill([0, 0]),
                betweenCurves: false
            };
        }

        _openGradientPicker() {
            // TODO: this would ideally not call global functions
            editor.call('picker:gradient', [this.value || this._getDefaultValue()]);

            // position picker
            const rectPicker = editor.call('picker:gradient:rect');
            const rectField = this.dom.getBoundingClientRect();
            editor.call('picker:gradient:position', rectField.right - rectPicker.width, rectField.bottom);

            // change event from the picker sets the new value
            let evtPickerChanged = editor.on('picker:curve:change', this._onPickerChange.bind(this));

            // refreshing the value resets the picker
            let evtRefreshPicker = this.on('change', (value) => {
                editor.call('picker:gradient:set', [value]);
            });

            // clean up when the picker is closed
            editor.once('picker:gradient:close', () => {
                evtRefreshPicker.unbind();
                evtRefreshPicker = null;
                evtPickerChanged.unbind();
                evtPickerChanged = null;
            });
        }

        _onPickerChange(paths, values) {
            const value = this.value || this._getDefaultValue();

            // TODO: this is all kinda hacky. We need to clear up
            // the events raised by the picker
            if (REGEX_KEYS.test(paths[0])) {
                // set new value with new keys but same type
                this.value = {
                    type: value.type,
                    keys: values,
                    betweenCurves: false
                };
            } else if (REGEX_TYPE.test(paths[0])) {
                // set new value with new type but same keys
                this.value = {
                    type: values[0],
                    keys: value.keys,
                    betweenCurves: false
                };
            }
        }

        _renderGradient() {
            const canvas = this._canvas.dom;
            const context = canvas.getContext('2d');

            const width = this._canvas.width;
            const height = this._canvas.height;
            const ratio = this._canvas.pixelRatio;

            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            context.fillStyle = this._checkerboardPattern;
            context.fillRect(0, 0, width, height);

            if (!this.value || !this.value.keys || !this.value.keys.length) {
                return;
            }

            const rgba = [];

            const curve = this.channels === 1 ? new pc.CurveSet([this.value.keys]) : new pc.CurveSet(this.value.keys);
            curve.type = this.value.type;

            const precision = 2;

            const gradient = context.createLinearGradient(0, 0, width, 0);

            for (let t = precision; t < width; t += precision) {
                curve.value(t / width, rgba);

                const r = Math.round((rgba[0] || 0) * 255);
                const g = Math.round((rgba[1] || 0) * 255);
                const b = Math.round((rgba[2] || 0) * 255);
                const a = this.channels === 4 ? (rgba[3] || 0) : 1;

                gradient.addColorStop(t / width, `rgba(${r}, ${g}, ${b}, ${a})`);
            }

            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);
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

            clearInterval(this._resizeInterval);
            this._resizeInterval = null;

            super.destroy();
        }

        get channels() {
            return this._channels;
        }

        set channels(value) {
            if (this._channels === value) return;
            this._channels = Math.max(1, Math.min(value, 4));

            // change default value

            if (this.value) {
                this._renderGradient();
            }
        }

        get value() {
            return this._value;
        }

        set value(value) {
            // TODO: maybe we should check for equality
            // but since this value will almost always be set using
            // the picker it's not worth the effort
            this._value = value;

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            this._renderGradient();

            this.emit('change', value);

            if (this._binding) {
                this._binding.setValue(value);
            }
        }

        set values(values) { // eslint-disable-line accessor-pairs
            // we do not support multiple values so just
            // add the multiple values class which essentially disables
            // the input
            this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            this._renderGradient();
        }
    }

    utils.implements(GradientInput, pcui.IBindable);
    utils.implements(GradientInput, pcui.IFocusable);

    pcui.Element.register('gradient', GradientInput, { renderChanges: true });

    return {
        GradientInput: GradientInput
    };
})());
