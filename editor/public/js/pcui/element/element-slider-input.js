Object.assign(pcui, (function () {
    'use strict';

    const CLASS_SLIDER = 'pcui-slider';
    const CLASS_SLIDER_CONTAINER = CLASS_SLIDER + '-container';
    const CLASS_SLIDER_BAR = CLASS_SLIDER + '-bar';
    const CLASS_SLIDER_HANDLE = CLASS_SLIDER + '-handle';
    const CLASS_SLIDER_ACTIVE = CLASS_SLIDER + '-active';

    // fields that are proxied between the slider and the numeric input
    const PROXY_FIELDS = [
        'allowNull',
        'max',
        'min',
        'keyChange',
        'placeholder',
        'precision',
        'renderChanges',
        'step'
    ];

    /**
     * @name pcui.SliderInput
     * @classdesc The SliderInput shows a pcui.NumericInput and a slider widget next to it. It acts as a proxy
     * of the NumericInput.
     * @property {Number} min Gets / sets the minimum value that the numeric input field can take.
     * @property {Number} max Gets / sets the maximum value that the numeric input field can take.
     * @property {Number} sliderMin Gets / sets the minimum value that the slider field can take.
     * @property {Number} sliderMax Gets / sets the maximum value that the slider field can take.
     * @property {Number} pre Gets / sets the maximum number of decimals a value can take.
     * @property {Number} step Gets / sets the amount that the value will be increased or decreased when using the arrow keys. Holding Shift will use 10x the step.
     * @property {Boolean} allowNull Gets / sets whether the value can be null. If not then it will be 0 instead of null.
     * @extends pcui.Element
     * @mixes pcui.IBindable
     * @mixes pcui.IFocusable
     */
    class SliderInput extends pcui.Element {
        /**
         * Creates a new SliderInput.
         * @param {Object} args The arguments. Extends the pcui.NumericInput constructor arguments.
         */
        constructor(args) {
            args = Object.assign({}, args);

            const inputArgs = {};
            PROXY_FIELDS.forEach(field => {
                inputArgs[field] = args[field];
            });

            if (inputArgs.precision === undefined) {
                inputArgs.precision = 2;
            }

            // binding should only go to the slider
            // and the slider will propagate changes to the numeric input
            delete inputArgs.binding;

            super(document.createElement('div'), args);

            this.class.add(CLASS_SLIDER);

            this._combineHistory = false;

            this._numericInput = new pcui.NumericInput(inputArgs);

            // propagate change event
            this._numericInput.on('change', this._onValueChange.bind(this));
            // propagate focus / blur events
            this._numericInput.on('focus', () => {
                this.emit('focus');
            });

            this._numericInput.on('blur', () => {
                this.emit('blur');
            });

            this._sliderMin = (args.sliderMin !== undefined ? args.sliderMin : this.min || 0);
            this._sliderMax = (args.sliderMax !== undefined ? args.sliderMax : this.max || 1);

            this.dom.appendChild(this._numericInput.dom);
            this._numericInput.parent = this;

            this._domSlider = document.createElement('div');
            this._domSlider.classList.add(CLASS_SLIDER_CONTAINER);
            this.dom.appendChild(this._domSlider);

            this._domBar = document.createElement('div');
            this._domBar.classList.add(CLASS_SLIDER_BAR);
            this._domBar.ui = this;
            this._domSlider.appendChild(this._domBar);

            this._domHandle = document.createElement('div');
            this._domHandle.ui = this;
            this._domHandle.tabIndex = 0;
            this._domHandle.classList.add(CLASS_SLIDER_HANDLE);
            this._domBar.appendChild(this._domHandle);

            this._domMouseDown = this._onMouseDown.bind(this);
            this._domMouseMove = this._onMouseMove.bind(this);
            this._domMouseUp = this._onMouseUp.bind(this);
            this._domTouchStart = this._onTouchStart.bind(this);
            this._domTouchMove = this._onTouchMove.bind(this);
            this._domTouchEnd = this._onTouchEnd.bind(this);
            this._domKeyDown = this._onKeyDown.bind(this);

            this._touchId = null;

            this._domBar.addEventListener('mousedown', this._domMouseDown);
            this._domBar.addEventListener('touchstart', this._domTouchStart, { passive: true });
            this._domHandle.addEventListener('keydown', this._domKeyDown);
        }

        _onMouseDown(evt) {
            if (evt.button !== 0 || !this.enabled || this.readOnly) return;
            this._onSlideStart(evt.pageX);
        }

        _onMouseMove(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this._onSlideMove(evt.pageX);
        }

        _onMouseUp(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this._onSlideEnd(evt.pageX);
        }

        _onTouchStart(evt) {
            if (!this.enabled || this.readOnly) return;

            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];
                if (! touch.target.ui || touch.target.ui !== this)
                    continue;

                this._touchId = touch.identifier;
                this._onSlideStart(touch.pageX);
                break;
            }
        }

        _onTouchMove(evt) {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];

                if (touch.identifier !== this._touchId)
                    continue;

                evt.stopPropagation();
                evt.preventDefault();

                this._onSlideMove(touch.pageX);
                break;
            }
        }

        _onTouchEnd(evt) {
            for (let i = 0; i < evt.changedTouches.length; i++) {
                const touch = evt.changedTouches[i];

                if (touch.identifier !== this._touchId)
                    continue;

                evt.stopPropagation();
                evt.preventDefault();

                this._onSlideEnd(touch.pageX);
                this._touchId = null;
                break;
            }
        }

        _onKeyDown(evt) {
            if (evt.keyCode === 27) {
                this.blur();
                return;
            }

            if (!this.enabled || this.readOnly) return;

            // move slider with left / right arrow keys
            if (evt.keyCode !== 37 && evt.keyCode !== 39) return;

            evt.stopPropagation();
            evt.preventDefault();
            let x = evt.keyCode === 37 ? -1 : 1;
            if (evt.shiftKey) {
                x *= 10;
            }

            this.value += x * this.step;
        }

        _updateHandle(value) {
            const left = Math.max(0, Math.min(1, ((value || 0) - this._sliderMin) / (this._sliderMax - this._sliderMin))) * 100;
            this._domHandle.style.left = left + '%';
        }

        _onValueChange(value) {
            this._updateHandle(value);
            this.emit('change', value);

            if (this._binding) {
                this._binding.setValue(value);
            }
        }

        _onSlideStart(pageX) {
            this._domHandle.focus();
            if (this._touchId === null) {
                window.addEventListener('mousemove', this._domMouseMove);
                window.addEventListener('mouseup', this._domMouseUp);
            } else {
                window.addEventListener('touchmove', this._domTouchMove);
                window.addEventListener('touchend', this._domTouchEnd);
            }

            this.class.add(CLASS_SLIDER_ACTIVE);

            this._onSlideMove(pageX);

            if (this.binding) {
                this._combineHistory = this.binding.historyCombine;
                this.binding.historyCombine = true;
            }
        }

        _onSlideMove(pageX) {
            const rect = this._domSlider.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (pageX - rect.left) / rect.width));

            const range = this._sliderMax - this._sliderMin;
            let value = (x * range) + this._sliderMin;
            value = parseFloat(value.toFixed(this.precision), 10);

            this.value = value;
        }

        _onSlideEnd(pageX) {
            this._onSlideMove(pageX);

            this.class.remove(CLASS_SLIDER_ACTIVE);

            if (this._touchId === null) {
                window.removeEventListener('mousemove', this._domMouseMove);
                window.removeEventListener('mouseup', this._domMouseUp);
            } else {
                window.removeEventListener('touchmove', this._domTouchMove);
                window.removeEventListener('touchend', this._domTouchEnd);
            }

            if (this.binding) {
                this.binding.historyCombine = this._combineHistory;
            }

        }

        focus() {
            this._numericInput.focus();
        }

        blur() {
            this._domHandle.blur();
            this._numericInput.blur();
        }

        destroy() {
            if (this._destroyed) return;
            this._domBar.removeEventListener('mousedown', this._domMouseDown);
            this._domBar.removeEventListener('touchstart', this._domTouchStart);

            this._domHandle.removeEventListener('keydown', this._domKeyDown);

            this.dom.removeEventListener('mouseup', this._domMouseUp);
            this.dom.removeEventListener('mousemove', this._domMouseMove);
            this.dom.removeEventListener('touchmove', this._domTouchMove);
            this.dom.removeEventListener('touchend', this._domTouchEnd);
            super.destroy();
        }

        get sliderMin() {
            return this._sliderMin;
        }

        set sliderMin(value) {
            if (this._sliderMin === value) return;

            this._sliderMin = value;
            this._updateHandle(this.value);
        }

        get sliderMax() {
            return this._sliderMax;
        }

        set sliderMax(value) {
            if (this._sliderMax === value) return;

            this._sliderMax = value;
            this._updateHandle(this.value);
        }

        get value() {
            return this._numericInput.value;
        }

        set value(value) {
            this._numericInput.value = value;
            if (this._numericInput.class.contains(pcui.CLASS_MULTIPLE_VALUES)) {
                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this.class.remove(pcui.CLASS_MULTIPLE_VALUES);
            }
        }

        set values(values) {
            this._numericInput.values = values;
            if (this._numericInput.class.contains(pcui.CLASS_MULTIPLE_VALUES)) {
                this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            } else {
                this.class.remove(pcui.CLASS_MULTIPLE_VALUES);
            }
        }
    }

    utils.proxy(SliderInput, '_numericInput', PROXY_FIELDS);
    utils.implements(SliderInput, pcui.IBindable);
    utils.implements(SliderInput, pcui.IFocusable);

    pcui.Element.register('slider', SliderInput, { renderChanges: true });

    return {
        SliderInput: SliderInput
    };
})());
