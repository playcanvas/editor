"use strict";

function CurveField(args) {
    var self = this; // eslint-disable-line no-unused-vars

    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this._element.classList.add('ui-curve-field');
    this._element.tabIndex = 0;
    this._element.addEventListener('keydown', this._onKeyDown, false);

    // canvas to render mini version of curves
    this.canvas = new ui.Canvas({ useDevicePixelRatio: true });
    this._element.appendChild(this.canvas.element);
    this.canvas.on('resize', this._render.bind(this));

    this._lineWidth = args.lineWidth || 1;

    // create checkerboard pattern
    this.checkerboardCanvas = new ui.Canvas();
    var size = 17;
    var halfSize = size / 2;
    this.checkerboardCanvas.width = size;
    this.checkerboardCanvas.height = size;
    var ctx = this.checkerboardCanvas.element.getContext('2d');
    ctx.fillStyle = '#';
    ctx.fillStyle = "#949a9c";
    ctx.fillRect(0, 0, halfSize, halfSize);
    ctx.fillRect(halfSize, halfSize, halfSize, halfSize);
    ctx.fillStyle = "#657375";
    ctx.fillRect(halfSize, 0, halfSize, halfSize);
    ctx.fillRect(0, halfSize, halfSize, halfSize);

    this.checkerboard = this.canvas.element.getContext('2d').createPattern(this.checkerboardCanvas.element, 'repeat');

    this._value = null;

    // curve field can contain multiple curves
    this._paths = [];

    this._linkSetHandlers = [];
    this._resizeInterval = null;
    this._suspendEvents = false;

    this._name = args.name;

    this.curveNames = args.curves;

    this.gradient = !!(args.gradient);

    this.min = 0;
    if (args.min !== undefined) {
        this.min = args.min;
    } else if (args.verticalValue !== undefined) {
        this.min = -args.verticalValue;
    }

    this.max = 1;
    if (args.max !== undefined) {
        this.max = args.max;
    } else if (args.verticalValue !== undefined) {
        this.max = args.verticalValue;
    }
}
CurveField.prototype = Object.create(ui.Element.prototype);

CurveField.prototype._onKeyDown = function (evt) {
    // esc
    if (evt.keyCode === 27)
        return this.blur();

    // enter
    if (evt.keyCode !== 32 || this.ui.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.ui.emit('click');
};

CurveField.prototype._resize = function (width, height) {
    if (this.canvas.width != width || this.canvas.height != height) {
        this.canvas.resize(width, height);
        this._render();
    }
};

// Override link method to use multiple paths instead of one
CurveField.prototype.link = function (link, paths) {
    if (this._link) this.unlink();
    this._link = link;
    this._paths = paths;

    this.emit('link', paths);

    // handle canvas resizing
    // 20 times a second
    // if size is already same, nothing will happen
    if (this._resizeInterval)
        clearInterval(this._resizeInterval);

    this._resizeInterval = setInterval(function () {
        var rect = this._element.getBoundingClientRect();
        this.canvas.resize(rect.width, rect.height);
    }.bind(this), 1000 / 20);

    if (this._onLinkChange) {
        var renderChanges = this.renderChanges;
        this.renderChanges = false;
        this._linkSetHandlers.push(this._link.on('*:set', function (path) {
            var paths = this._paths;
            var len = paths.length;
            for (var i = 0; i < len; i++) {
                if (path.indexOf(paths[i]) === 0) {
                    this._onLinkChange();
                    break;
                }
            }
        }.bind(this)));

        this._onLinkChange();

        this.renderChanges = renderChanges;
    }
};

// Override unlink method to use multiple paths instead of one
CurveField.prototype.unlink = function () {
    if (!this._link) return;

    this.emit('unlink', this._paths);

    this._linkSetHandlers.forEach(function (handler) {
        handler.unbind();
    });

    this._linkSetHandlers.length = 0;

    clearInterval(this._resizeInterval);

    this._link = null;
    this._value = null;
    this._paths.length = 0;
};


CurveField.prototype._onLinkChange = function () {
    if (this._suspendEvents) return;

    // gather values of all paths and set new value
    var values = [];

    for (var i = 0; i < this._paths.length; i++) {
        var value = this._link.get(this._paths[i]);
        if (value !== undefined) {
            values.push(value);
        } else {
            values.push(null);
        }
    }

    this._setValue(values);
};

Object.defineProperty(CurveField.prototype, 'value', {
    get: function () {
        return this._value;
    },
    set: function (value) {
        this._setValue(value);
    }
});

CurveField.prototype._setValue = function (value) {
    this._value = value;
    this._render();
    this.emit('change', value);
};

CurveField.prototype._render = function () {
    if (this.gradient) {
        this._renderGradient();
    } else {
        this._renderCurves();
    }
};

// clamp val between min and max only if it's less / above them but close to them
// this is mostly to allow splines to go over the limit but if they are too close to
// the edge then they will avoid rendering half-height lines
CurveField.prototype._clampEdge = function (val, min, max) {
    if (val < min && val > min - 2) return min;
    if (val > max && val < max + 2) return max;
    return val;
};

// Renders all curves
CurveField.prototype._renderCurves = function () {
    var canvas = this.canvas.element;
    var context = canvas.ctx = canvas.ctx || canvas.getContext('2d');
    var value = this.value;

    var width = this.canvas.pixelWidth;
    var height = this.canvas.pixelHeight;

    // draw background
    context.clearRect(0, 0, width, height);

    var curveColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)', 'rgb(255, 255, 255)'];
    var fillColors = ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)', 'rgba(255, 255, 255, 0.5)'];

    var minMax = this._getMinMaxValues(value);

    // draw curves
    if (value && value[0]) {
        var primaryCurves = this._valueToCurves(value[0]);

        if (!primaryCurves)
            return;

        var secondaryCurves = value[0].betweenCurves && value.length > 1 ? this._valueToCurves(value[1]) : null;

        var minValue = minMax[0];
        var maxValue = minMax[1];

        context.lineWidth = this._lineWidth;

        // prevent divide by 0
        if (width === 0) {
            return;
        }

        for (var i = 0; i < primaryCurves.length; i++) {
            var val, x;

            context.strokeStyle = curveColors[i];
            context.fillStyle = fillColors[i];

            context.beginPath();
            context.moveTo(0, this._clampEdge(height * (1 - (primaryCurves[i].value(0) - minValue) / (maxValue - minValue)), 1, height - 1));

            var precision = 1;

            for (x = 0; x < Math.floor(width / precision); x++) {
                val = primaryCurves[i].value(x * precision / width);
                context.lineTo(x * precision, this._clampEdge(height * (1 - (val - minValue) / (maxValue - minValue)), 1, height - 1));
            }

            if (secondaryCurves) {
                for (x = Math.floor(width / precision); x >= 0; x--) {
                    val = secondaryCurves[i].value(x * precision / width);
                    context.lineTo(x * precision, this._clampEdge(height * (1 - (val - minValue) / (maxValue - minValue)), 1, height - 1));
                }

                context.closePath();
                context.fill();
            }

            context.stroke();
        }
    }
};

// Renders color-type graph as a gradient
CurveField.prototype._renderGradient = function () { // eslint-disable-line
    var canvas = this.canvas.element;
    var context = canvas.ctx = canvas.cxt || canvas.getContext('2d');
    var value = this.value && this.value.length ? this.value[0] : null;

    context.fillStyle = this.checkerboard;
    context.fillRect(0, 0, canvas.width, canvas.height);

    var swizzle = [0, 1, 2, 3];
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
        var rgb = [];

        var curve = this.curveNames && this.curveNames.length === 1 ? new pc.CurveSet([value.keys]) : new pc.CurveSet(value.keys);
        curve.type = value.type;

        var precision = 2;

        var gradient = context.createLinearGradient(0, 0, canvas.width, 0);

        for (var t = precision; t < canvas.width; t += precision) {
            curve.value(t / canvas.width, rgb);

            var rgba = Math.round((rgb[swizzle[0]] || 0) * 255) + ',' +
                       Math.round((rgb[swizzle[1]] || 0) * 255) + ',' +
                       Math.round((rgb[swizzle[2]] || 0) * 255) + ',' +
                       (isNaN(rgb[swizzle[3]]) ? 1 : rgb[swizzle[3]]);

            gradient.addColorStop(t / canvas.width, 'rgba(' + rgba + ')');
        }

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

    } else {
        // no keys in the curve so just render black color
        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
};

// Returns minimum and maximum values for all curves
CurveField.prototype._getMinMaxValues = function (curves) {
    var minValue = Infinity;
    var maxValue = -Infinity;
    var i, len;

    if (curves) {
        if (curves.length === undefined) {
            curves = [curves];
        }

        curves.forEach(function (value) {
            if (value && value.keys && value.keys.length) {
                if (value.keys[0].length !== undefined) {
                    value.keys.forEach(function (data) {

                        for (i = 1, len = data.length; i < len; i += 2) {
                            if (data[i] > maxValue) {
                                maxValue = data[i];
                            }

                            if (data[i] < minValue) {
                                minValue = data[i];
                            }
                        }
                    });
                } else {
                    for (i = 1, len = value.keys.length; i < len; i += 2) {
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

    // try to limit minValue and maxValue
    // between the min / max values for the curve field
    if (minValue > this.min) {
        minValue = this.min;
    }

    if (maxValue < this.max) {
        maxValue = this.max;
    }

    return [minValue, maxValue];
};

CurveField.prototype._valueToCurves = function (value) { // eslint-disable-line 
    var curves = null;

    if (value && value.keys && value.keys.length) {
        curves = [];
        var curve;
        if (value.keys[0].length !== undefined) {
            value.keys.forEach(function (data, index) {
                curve = new pc.Curve(data);
                curve.type = value.type;
                curves.push(curve);
            });
        } else {
            curve = new pc.Curve(value.keys);
            curve.type = value.type;
            curves.push(curve);
        }
    }

    return curves;
};

window.ui.CurveField = CurveField;
