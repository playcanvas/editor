"use strict"

function CurveField(args) {
    ui.Element.call(this);
    args = args || { };

    this.element = document.createElement('div');
    this.element.classList.add('ui-curve-field');
    this.element.tabIndex = 0;

    // canvas to render mini version of curves
    this.canvas = new ui.Canvas();
    this.element.appendChild(this.canvas.element);
    this.canvas.on('resize', this._render.bind(this));

    this._value = null;

    // curve field can contain multiple curves
    this._paths = [];

    this._linkSetHandlers = [];
    this._resizeInterval = null;
    this._suspendEvents = false;

    this._name = args.name;

    this._gradientRendering = !!(args.gradient);
}

CurveField.prototype = Object.create(ui.Element.prototype);

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

    if (changed) {
        this._render();
    }
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
    if (this._resizeInterval) {
        clearInterval(this._resizeInterval);
    }

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
        if (this._link) {
            var oldValues = [];

            var enabled = this._link.history.enabled;
            this._suspendEvents = true;
            this._link.history.enabled = false;

            this._paths.forEach(function (path, index) {
                // remember old values so that we can undo later
                oldValues.push(this._link.get(path));

                this._link.set(path, value ? value[index] : null);
            }.bind(this));

            this._suspendEvents = false;
            this._link.history.enabled = enabled;

            // record undo action to handle setting all paths as one action
            var action = {
                name: 'entity.' + this._link.resource_id + '.components.particlesystem.' + this._name,
                combine: this._link.history.combine,
                undo: function () {
                    // temporarily disable history
                    var enabled = this._link.history.enabled;
                    this._link.history.enabled = false;
                    this._suspendEvents = true;

                    // set old values
                    this._paths.forEach(function (path, index) {
                        this._link.set(path, oldValues[index]);
                    }.bind(this));

                    // re-enable history
                    this._suspendEvents = false;
                    this._link.history.enabled = enabled;

                    this._setValue(oldValues);
                }.bind(this),
                redo: function () {
                    // disable history
                    var enabled = this._link.history.enabled;
                    this._link.history.enabled = false;
                    this._suspendEvents = true;

                    // re-set values
                    this._paths.forEach(function (path, index) {
                        this._link.set(path, value ? value[index] : null);
                    }.bind(this));

                    // re-enable history
                    this._suspendEvents = false;
                    this._link.history.enabled = enabled;

                    this._setValue(value);
                }.bind(this)
            };

            // raise history event
            if (action.combine) {
                this._link.history.emit('record', 'update', action);
            } else {
                this._link.history.emit('record', 'add', action);
            }

        }

        this._setValue(value);
    }
});

CurveField.prototype._setValue = function (value) {
    this._value = value;
    this._render();
    this.emit('change', value);
};

CurveField.prototype._render = function () {
    if (this._gradientRendering) {
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
    // context.fillStyle = '#293538';
    // context.fillRect(0, 0, canvas.width, canvas.height);

    var curveColors = ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)'];
    var fillColors = ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)'];

    var minMax = this._getMinMaxValues(value);

    // draw curves
    if (value && value[0]) {
        var primaryCurves = this._valueToCurves(value[0]);
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

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (value && value.keys && value.keys.length) {
        var rgb = [];
        var color = new pc.Color();

        var curve = new pc.CurveSet(value.keys);
        curve.type = value.type;

        var precision = 2;

        context.lineWidth = canvas.height;

        for (var t = precision; t < canvas.width; t += precision) {
            curve.value(t / canvas.width, rgb);
            color.set(rgb[0], rgb[1], rgb[2]);

            context.beginPath();
            context.moveTo(t - precision, canvas.height * 0.5);
            context.lineTo(t, canvas.height * 0.5);
            context.strokeStyle = color.toString();
            context.stroke();
        }

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

    if (value && value.keys.length) {
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
