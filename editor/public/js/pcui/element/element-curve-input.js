Object.assign(pcui, (function () {
    'use strict';

    const CLASS_CURVE = 'pcui-curve';

    /**
     * @name pcui.CurveInput
     * @classdesc Shows a curve or curveset
     * @property {Boolean} renderChanges If true the input will flash when changed.
     * @extends pcui.Element
     */
    class CurveInput extends pcui.Element {
        /**
         * Creates a new pcui.CurveInput.
         * @param {Object} args The arguments.
         * @param {Number} [args.lineWidth] The width of the rendered lines in pixels.
         * @param {Number} [args.min] The minimum value that curves can take.
         * @param {Number} [args.max] The maximum value that curves can take.
         * @param {Number} [args.verticalValue] The default maximum and minimum values to show if min and max are undefined.
         * @param {Boolean} [args.hideRandomize] Whether to hide the randomize button in the curve picker.
         */
        constructor(args) {
            args = Object.assign({
                tabIndex: 0
            }, args);

            super(document.createElement('div'), args);

            this.class.add(CLASS_CURVE);

            this._canvas = new pcui.Canvas({useDevicePixelRatio: true});
            this.dom.appendChild(this._canvas.dom);
            this._canvas.parent = this;
            this._canvas.on('resize', this._renderCurves.bind(this));

            // make sure canvas is the same size as the container element
            // 20 times a second
            this._resizeInterval = setInterval(() => {
                this._canvas.resize(this.width, this.height);
            }, 1000 / 20);

            this._pickerChanging = false;
            this._combineHistory = false;
            this._historyPostfix = false;

            this._domEventKeyDown = this._onKeyDown.bind(this);
            this._domEventFocus = this._onFocus.bind(this);
            this._domEventBlur = this._onBlur.bind(this);

            this.dom.addEventListener('keydown', this._domEventKeyDown);
            this.dom.addEventListener('focus', this._domEventFocus);
            this.dom.addEventListener('blur', this._domEventBlur);

            this.on('click', () => {
                if (!this.enabled || this.readOnly || this.class.contains(pcui.CLASS_MULTIPLE_VALUES)) return;
                this._openCurvePicker();
            });

            this._lineWidth = args.lineWidth || 1;

            this._min = 0;
            if (args.min !== undefined) {
                this._min = args.min;
            } else if (args.verticalValue !== undefined) {
                this._min = -args.verticalValue;
            }

            this._max = 1;
            if (args.max !== undefined) {
                this._max = args.max;
            } else if (args.verticalValue !== undefined) {
                this._max = args.verticalValue;
            }

            // default value
            this._value = this._getDefaultValue();

            if (args.value) {
                this.value = args.value;
            }

            this.renderChanges = args.renderChanges || false;

            this.on('change', () => {
                if (this.renderChanges) {
                    this.flash();
                }
            });

            // arguments for the curve picker
            this._pickerArgs = {
                min: args.min,
                max: args.max,
                verticalValue: args.verticalValue,
                curves: args.curves,
                hideRandomize: args.hideRandomize
            };
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

            this._openCurvePicker();
        }

        _onFocus(evt) {
            this.emit('focus');
        }

        _onBlur(evt) {
            this.emit('blur');
        }

        _getDefaultValue() {
            return [{
                type: 4,
                keys: [0, 0],
                betweenCurves: false
            }];
        }

        _openCurvePicker() {
            // TODO: don't use global functions
            editor.call('picker:curve', utils.deepCopy(this.value), this._pickerArgs);

            // position picker
            const rectPicker = editor.call('picker:curve:rect');
            const rectField = this.dom.getBoundingClientRect();
            editor.call('picker:curve:position', rectField.right - rectPicker.width, rectField.bottom);

            let evtChangeStart = editor.on('picker:curve:change:start', () => {
                if (this._pickerChanging) return;
                this._pickerChanging = true;

                if (this._binding) {
                    this._combineHistory = this._binding.historyCombine;
                    this._historyPostfix = this._binding.historyPostfix;

                    this._binding.historyCombine = true;
                    // assign a history postfix which will limit how far back
                    // the history will be combined. We only want to combine
                    // history between this curve:change:start and curve:change:end events
                    // not further back
                    this._binding.historyPostfix = `(${Date.now()})`;
                }
            });

            let evtChangeEnd = editor.on('picker:curve:change:end', () => {
                if (!this._pickerChanging) return;
                this._pickerChanging = false;

                if (this._binding) {
                    this._binding.historyCombine = this._combineHistory;
                    this._binding.historyPostfix = this._historyPostfix;

                    this._combineHistory = false;
                    this._historyPostfix = null;
                }
            });

            let evtPickerChanged = editor.on('picker:curve:change', this._onPickerChange.bind(this));

            let evtRefreshPicker = this.on('change', value => {
                const args = Object.assign({
                    keepZoom: true
                }, this._pickerArgs);

                editor.call('picker:curve:set', value, args);
            });

            editor.once('picker:curve:close', function () {
                evtRefreshPicker.unbind();
                evtRefreshPicker = null;
                evtPickerChanged.unbind();
                evtPickerChanged = null;
                evtChangeStart.unbind();
                evtChangeStart = null;
                evtChangeEnd.unbind();
                evtChangeEnd = null;
            });
        }

        _onPickerChange(paths, values) {
            if (!this.value) return;

            // maybe we should deepCopy the value instead but not doing
            // it now for performance
            const value = utils.deepCopy(this.value);

            // patch our value with the values coming from the picker
            // which will trigger a change to the binding if one exists
            for (let i = 0; i < paths.length; i++) {
                const parts = paths[i].split('.');
                const curve = value[parseInt(parts[0], 10)];
                if (!curve) continue;

                if (parts.length === 3) {
                    curve[parts[1]][parseInt(parts[2], 10)] = values[i];
                } else {
                    curve[parts[1]] = values[i];
                }
            }

            this.value = value;
        }

        _getMinMaxValues(value) {
            let minValue = Infinity;
            let maxValue = -Infinity;

            if (value) {
                if (!Array.isArray(value)) {
                    value = [value];
                }

                value.forEach(value => {
                    if (!value || !value.keys || !value.keys.length) return;

                    if (Array.isArray(value.keys[0])) {
                        value.keys.forEach(data => {
                            for (let i = 1; i < data.length; i += 2) {
                                if (data[i] > maxValue) {
                                    maxValue = data[i];
                                }

                                if (data[i] < minValue) {
                                    minValue = data[i];
                                }
                            }
                        });
                    } else {
                        for (let i = 1; i < value.keys.length; i += 2) {
                            if (value.keys[i] > maxValue) {
                                maxValue = value.keys[i];
                            }

                            if (value.keys[i] < minValue) {
                                minValue = value.keys[i];
                            }
                        }
                    }
                });
            }

            if (minValue === Infinity) {
                minValue = this._min;
            }

            if (maxValue === -Infinity) {
                maxValue = this._max;
            }

            // try to limit minValue and maxValue
            // between the min / max values for the curve field
            if (minValue > this._min) {
                minValue = this._min;
            }

            if (maxValue < this._max) {
                maxValue = this._max;
            }

            return [minValue, maxValue];
        }

        // clamp val between min and max only if it's less / above them but close to them
        // this is mostly to allow splines to go over the limit but if they are too close to
        // the edge then they will avoid rendering half-height lines
        _clampEdge(val, min, max) {
            if (val < min && val > min - 2) return min;
            if (val > max && val < max + 2) return max;
            return val;
        }

        _convertValueToCurves(value) {
            if (!value || !value.keys || !value.keys.length) return null;

            if (value.keys[0].length !== undefined) {
                return value.keys.map(data => {
                    const curve = new pc.Curve(data);
                    curve.type = value.type;
                    return curve;
                });
            }

            const curve = new pc.Curve(value.keys);
            curve.type = value.type;
            return [curve];
        }

        _renderCurves() {
            const canvas = this._canvas.dom;
            const context = canvas.getContext('2d');
            const value = this.value;

            const width = this._canvas.width;
            const height = this._canvas.height;
            const ratio = this._canvas.pixelRatio;

            context.setTransform(ratio, 0, 0, ratio, 0, 0);

            // draw background
            context.clearRect(0, 0, width, height);

            const curveColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)', 'rgb(255, 255, 255)'];
            const fillColors = ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)', 'rgba(255, 255, 255, 0.5)'];

            const minMax = this._getMinMaxValues(value);

            if (!value || !value[0]) return;

            // draw curves
            const primaryCurves = this._convertValueToCurves(value[0]);

            if (!primaryCurves) return;

            const secondaryCurves = value[0].betweenCurves && value.length > 1 ? this._convertValueToCurves(value[1]) : null;

            const minValue = minMax[0];
            const maxValue = minMax[1];

            context.lineWidth = this._lineWidth;

            // prevent divide by 0
            if (width === 0) return;

            for (let i = 0; i < primaryCurves.length; i++) {
                context.strokeStyle = curveColors[i];
                context.fillStyle = fillColors[i];

                context.beginPath();
                context.moveTo(0, this._clampEdge(height * (1 - (primaryCurves[i].value(0) - minValue) / (maxValue - minValue)), 1, height - 1));

                const precision = 1;

                for (let x = 0; x < Math.floor(width / precision); x++) {
                    const val = primaryCurves[i].value(x * precision / width);
                    context.lineTo(x * precision, this._clampEdge(height * (1 - (val - minValue) / (maxValue - minValue)), 1, height - 1));
                }

                if (secondaryCurves) {
                    for (let x = Math.floor(width / precision); x >= 0; x--) {
                        const val = secondaryCurves[i].value(x * precision / width);
                        context.lineTo(x * precision, this._clampEdge(height * (1 - (val - minValue) / (maxValue - minValue)), 1, height - 1));
                    }

                    context.closePath();
                    context.fill();
                }

                context.stroke();
            }
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

        get value() {
            return this._value;
        }

        set value(value) {
            // TODO: maybe we should check for equality
            // but since this value will almost always be set using
            // the picker it's not worth the effort
            this._value = Array.isArray(value) ? utils.deepCopy(value) : [utils.deepCopy(value)];

            this.class.remove(pcui.CLASS_MULTIPLE_VALUES);

            this._renderCurves();

            this.emit('change', value);

            if (this._binding) {
                this._binding.setValues(this._value);
            }
        }

        set values(values) {
            // we do not support multiple values so just
            // add the multiple values class which essentially disables
            // the input
            this.class.add(pcui.CLASS_MULTIPLE_VALUES);
            this._renderCurves();
        }
    }

    utils.implements(CurveInput, pcui.IBindable);
    utils.implements(CurveInput, pcui.IFocusable);

    pcui.Element.register('curveset', CurveInput, { renderChanges: true });

    return {
        CurveInput: CurveInput
    };
})());
