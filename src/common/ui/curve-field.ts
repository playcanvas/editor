import { Curve, CurveSet } from 'playcanvas';

import { LegacyCanvas } from './canvas';
import { LegacyElement } from './element';

class LegacyCurveField extends LegacyElement {
    constructor(args = {}) {
        super();
        this.element = document.createElement('div');
        this._element.classList.add('ui-curve-field');
        this._element.tabIndex = 0;
        this._element.addEventListener('keydown', this._onKeyDown.bind(this), false);

        this.canvas = new LegacyCanvas({ useDevicePixelRatio: true });
        this._element.appendChild(this.canvas.element);
        this.canvas.on('resize', this._render.bind(this));

        this._lineWidth = args.lineWidth || 1;

        this.checkerboardCanvas = new LegacyCanvas();
        const size = 17;
        const halfSize = size / 2;
        this.checkerboardCanvas.width = size;
        this.checkerboardCanvas.height = size;
        const ctx = this.checkerboardCanvas.element.getContext('2d');
        ctx.fillStyle = '#949a9c';
        ctx.fillRect(0, 0, halfSize, halfSize);
        ctx.fillRect(halfSize, halfSize, halfSize, halfSize);
        ctx.fillStyle = '#657375';
        ctx.fillRect(halfSize, 0, halfSize, halfSize);
        ctx.fillRect(0, halfSize, halfSize, halfSize);

        this.checkerboard = this.canvas.element.getContext('2d').createPattern(this.checkerboardCanvas.element, 'repeat');

        this._value = null;
        this._paths = [];
        this._linkSetHandlers = [];
        this._resizeInterval = null;
        this._name = args.name;
        this.curveNames = args.curves;
        this.gradient = !!args.gradient;

        this.min = args.min !== undefined ? args.min : (args.verticalValue !== undefined ? -args.verticalValue : 0);
        this.max = args.max !== undefined ? args.max : (args.verticalValue !== undefined ? args.verticalValue : 1);
    }

    set value(value) {
        this._setValue(value);
    }

    get value() {
        return this._value;
    }

    _onKeyDown(evt) {
        if (evt.keyCode === 27) {
            return this._element.blur();
        }

        if (evt.keyCode !== 32 || this.disabled) {
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();
        this.emit('click');
    }

    _resize(width, height) {
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.resize(width, height);
            this._render();
        }
    }

    link(link, paths) {
        if (this._link) {
            this.unlink();
        }
        this._link = link;
        this._paths = paths;

        this.emit('link', paths);

        if (this._resizeInterval) {
            clearInterval(this._resizeInterval);
        }

        this._resizeInterval = setInterval(() => {
            const rect = this._element.getBoundingClientRect();
            this.canvas.resize(rect.width, rect.height);
        }, 1000 / 20);

        if (this._onLinkChange) {
            const renderChanges = this.renderChanges;
            this.renderChanges = false;
            this._linkSetHandlers.push(this._link.on('*:set', (path) => {
                const paths = this._paths;
                const len = paths.length;
                for (let i = 0; i < len; i++) {
                    if (path.indexOf(paths[i]) === 0) {
                        this._onLinkChange();
                        break;
                    }
                }
            }));

            this._onLinkChange();

            this.renderChanges = renderChanges;
        }
    }

    unlink() {
        if (!this._link) {
            return;
        }

        this.emit('unlink', this._paths);

        this._linkSetHandlers.forEach((handler) => {
            handler.unbind();
        });

        this._linkSetHandlers.length = 0;

        clearInterval(this._resizeInterval);

        this._link = null;
        this._value = null;
        this._paths.length = 0;
    }

    _onLinkChange() {
        if (this.suspendEvents) {
            return;
        }

        const values = [];

        for (let i = 0; i < this._paths.length; i++) {
            const value = this._link.get(this._paths[i]);
            values.push(value !== undefined ? value : null);
        }

        this._setValue(values);
    }

    _setValue(value) {
        this._value = value;
        this._render();
        this.emit('change', value);
    }

    _render() {
        if (this.gradient) {
            this._renderGradient();
        } else {
            this._renderCurves();
        }
    }

    _clampEdge(val, min, max) {
        if (val < min && val > min - 2) {
            return min;
        }
        if (val > max && val < max + 2) {
            return max;
        }
        return val;
    }

    _renderCurves() {
        const canvas = this.canvas.element;
        const context = canvas.ctx = canvas.ctx || canvas.getContext('2d');
        const value = this.value;

        const width = this.canvas.pixelWidth;
        const height = this.canvas.pixelHeight;

        context.clearRect(0, 0, width, height);

        const curveColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)', 'rgb(255, 255, 255)'];
        const fillColors = ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)', 'rgba(255, 255, 255, 0.5)'];

        const minMax = this._getMinMaxValues(value);

        if (value && value[0]) {
            const primaryCurves = this._valueToCurves(value[0]);

            if (!primaryCurves) {
                return;
            }

            const secondaryCurves = value[0].betweenCurves && value.length > 1 ? this._valueToCurves(value[1]) : null;

            const minValue = minMax[0];
            const maxValue = minMax[1];

            context.lineWidth = this._lineWidth;

            if (width === 0) {
                return;
            }

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
    }

    _renderGradient() {
        const canvas = this.canvas.element;
        const context = canvas.ctx = canvas.ctx || canvas.getContext('2d');
        const value = this.value && this.value.length ? this.value[0] : null;

        context.fillStyle = this.checkerboard;
        context.fillRect(0, 0, canvas.width, canvas.height);

        let swizzle = [0, 1, 2, 3];
        if (this.curveNames && this.curveNames.length === 1) {
            if (this.curveNames[0] === 'g') {
                swizzle = [1, 0, 2, 3];
            } else if (this.curveNames[0] === 'b') {
                swizzle = [2, 1, 0, 3];
            } else if (this.curveNames[0] === 'a') {
                swizzle = [3, 1, 2, 0];
            }
        }

        if (value && value.keys && value.keys.length) {
            const rgb = [];

            const curve = this.curveNames && this.curveNames.length === 1 ? new CurveSet([value.keys]) : new CurveSet(value.keys);
            curve.type = value.type;

            const precision = 2;

            const gradient = context.createLinearGradient(0, 0, canvas.width, 0);

            for (let t = precision; t < canvas.width; t += precision) {
                curve.value(t / canvas.width, rgb);

                const rgba = `${Math.round((rgb[swizzle[0]] || 0) * 255)},${
                    Math.round((rgb[swizzle[1]] || 0) * 255)},${
                    Math.round((rgb[swizzle[2]] || 0) * 255)},${
                    isNaN(rgb[swizzle[3]]) ? 1 : rgb[swizzle[3]]}`;

                gradient.addColorStop(t / canvas.width, `rgba(${rgba})`);
            }

            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);

        } else {
            context.fillStyle = 'black';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    _getMinMaxValues(curves) {
        let minValue = Infinity;
        let maxValue = -Infinity;

        if (curves) {
            if (curves.length === undefined) {
                curves = [curves];
            }

            curves.forEach((value) => {
                if (value && value.keys && value.keys.length) {
                    if (value.keys[0].length !== undefined) {
                        value.keys.forEach((data) => {
                            for (let i = 1, len = data.length; i < len; i += 2) {
                                if (data[i] > maxValue) {
                                    maxValue = data[i];
                                }

                                if (data[i] < minValue) {
                                    minValue = data[i];
                                }
                            }
                        });
                    } else {
                        for (let i = 1, len = value.keys.length; i < len; i += 2) {
                            if (value.keys[i] > maxValue) {
                                maxValue = value.keys[i];
                            }

                            if (value.keys[i] < minValue) {
                                minValue = value.keys[i];
                            }
                        }
                    }
                }
            });
        }

        if (minValue === Infinity) {
            minValue = this.min;
        }

        if (maxValue === -Infinity) {
            maxValue = this.max;
        }

        if (minValue > this.min) {
            minValue = this.min;
        }

        if (maxValue < this.max) {
            maxValue = this.max;
        }

        return [minValue, maxValue];
    }

    _valueToCurves(value) {
        let curves = null;

        if (value && value.keys && value.keys.length) {
            curves = [];
            let curve;
            if (value.keys[0].length !== undefined) {
                value.keys.forEach((data, index) => {
                    curve = new Curve(data);
                    curve.type = value.type;
                    curves.push(curve);
                });
            } else {
                curve = new Curve(value.keys);
                curve.type = value.type;
                curves.push(curve);
            }
        }

        return curves;
    }
}

export { LegacyCurveField };
