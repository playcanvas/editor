"use strict"

function CurveField(args) {
    var self = this;

    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-curve-field');
    this.element.tabIndex = 0;
    this.element.addEventListener('keydown', this._onKeyDown.bind(this), false);

    // canvas to render mini version of curves
    this.canvas = new ui.Canvas();
    this.element.appendChild(this.canvas.element);
    this.canvas.on('resize', this._render.bind(this));

    // create checkerboard pattern
    this.checkerboardCanvas = new ui.Canvas();
    var size = 17;
    var halfSize = size/2;
    this.checkerboardCanvas.width = size;
    this.checkerboardCanvas.height = size;
    var ctx = this.checkerboardCanvas.element.getContext('2d');
    ctx.fillStyle = '#'
    ctx.fillStyle = "#949a9c";
    ctx.fillRect(0,0,halfSize,halfSize);
    ctx.fillRect(halfSize,halfSize,halfSize,halfSize);
    ctx.fillStyle = "#657375";
    ctx.fillRect(halfSize,0,halfSize,halfSize);
    ctx.fillRect(0,halfSize,halfSize,halfSize);

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
}
CurveField.prototype = Object.create(ui.Element.prototype);

CurveField.prototype._onKeyDown = function(evt) {
    // esc
    if (evt.keyCode === 27)
        return this.element.blur();

    // enter
    if (evt.keyCode !== 32 || this.disabled)
        return;

    evt.stopPropagation();
    evt.preventDefault();
    this.emit('click');
};

CurveField.prototype._resize = function(width, height) {
    var changed = false;
    if (this.canvas.width !== width) {
        this.canvas.width = width;
        changed = true;
    }

    if (this.canvas.height !== height) {
        this.canvas.height = height;
        changed = true;
    }

    if (changed)
        this._render();
};

// Override link method to use multiple paths instead of one
CurveField.prototype.link = function(link, paths) {
    if (this._link) this.unlink();
    this._link = link;
    this._paths = paths;

    this.emit('link', paths);

    // handle canvas resizing
    // 20 times a second
    // if size is already same, nothing will happen
    if (this._resizeInterval)
        clearInterval(this._resizeInterval);

    this._resizeInterval = setInterval(function() {
        var rect = this.element.getBoundingClientRect();
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
CurveField.prototype.unlink = function() {
    if (! this._link) return;

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
    get: function() {
        return this._value;
    },
    set: function(value) {
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

// Renders all curves
CurveField.prototype._renderCurves = function () {
    var canvas = this.canvas.element;
    var context = canvas.ctx = canvas.ctx || canvas.getContext('2d');
    var value = this.value;

    // draw background
    context.clearRect(0, 0, canvas.width, canvas.height);

    var curveColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)', 'rgb(255, 255, 255)'];
    var fillColors = ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)', 'rgba(255, 255, 255, 0.5)'];

    var minMax = this._getMinMaxValues(value);

    // draw curves
    if (value && value[0]) {
        var primaryCurves = this._valueToCurves(value[0]);

        if (! primaryCurves)
            return;

        var secondaryCurves = value[0].betweenCurves && value.length > 1 ? this._valueToCurves(value[1]) : null;

        var minValue = minMax[0];
        var maxValue = minMax[1];

        context.lineWidth = 1;

        for (var i = 0; i < primaryCurves.length; i++) {
            var val, x;

            context.strokeStyle = curveColors[i];
            context.fillStyle = fillColors[i];

            context.beginPath();
            context.moveTo(0, canvas.height * (1 - (primaryCurves[i].value(0) - minValue) / (maxValue - minValue)));

            var precision = 1;

            for(x = 0; x < Math.floor(canvas.width / precision); x++) {
                val = primaryCurves[i].value(x * precision / canvas.width);
                context.lineTo(x * precision, canvas.height * (1 - (val - minValue) / (maxValue - minValue)));
            }

            if (secondaryCurves) {
                for(x = Math.floor(canvas.width / precision) ; x >= 0; x--) {
                    val = secondaryCurves[i].value(x * precision / canvas.width);
                    context.lineTo(x * precision, canvas.height * (1 - (val - minValue) / (maxValue - minValue)));
                }

                context.closePath();
                context.fill();
            }

            context.stroke();
        }
    }
};

// Renders color-type graph as a gradient
CurveField.prototype._renderGradient = function () {
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

        var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);

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
},

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

    // If no curves were found set min to 0...
    if (minValue === Infinity) {
        minValue = 0;
    }

    // ... and max to 1
    if (maxValue === -Infinity) {
        maxValue = 1;
    }

    // if min and max are equal then offset them both by 0.5
    // so that the straight line is rendered in the middle of the canvas
    if (minValue === maxValue) {
        minValue -= 0.5;
        maxValue += 0.5;
    }

    return [minValue, maxValue];
};

CurveField.prototype._valueToCurves = function (value) {
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
},

window.ui.CurveField = CurveField;
