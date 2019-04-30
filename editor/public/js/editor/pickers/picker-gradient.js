
// helpers

function Helpers() { }

Object.assign(Helpers, {
    rgbaStr : function(colour, scale) {
        if (!scale) { scale = 1; }
        var rgba = colour.map(function(element) {
            return Math.round(element * scale);
        } ).join(',');
        for (var i=colour.length; i<4; ++i) {
            rgba += ',' + scale;
        }
        return 'rgba(' + rgba + ')';
    },

    hexStr : function(clr) {
        return clr.map(function(v) {
            return ('00' + v.toString(16)).slice(-2).toUpperCase();
        }).join('');
    },
});

// color picker

function ColorPicker(parent) {
    Events.call(this);

    // capture this for the event handler
    function genEvtHandler(self, func) {
        return function(evt) {
            func.apply(self, [evt]);
        }
    };
    
    this.panel = new ui.Panel();
    this.panel.class.add('color-panel')
    parent.appendChild(this.panel.element);

    this.colorRect = new ui.Canvas();
    this.colorRect.class.add('color-rect');
    this.panel.append(this.colorRect.element);
    this.colorRect.resize(this.colorRect.element.clientWidth * window.devicePixelRatio,
                          this.colorRect.element.clientHeight * window.devicePixelRatio);

    this.colorHandle = document.createElement('div');
    this.colorHandle.classList.add('color-handle');
    this.panel.append(this.colorHandle);

    this.hueRect = new ui.Canvas();
    this.hueRect.class.add('hue-rect');
    this.panel.append(this.hueRect.element);
    this.hueRect.resize(this.hueRect.element.clientWidth * window.devicePixelRatio,
                        this.hueRect.element.clientHeight * window.devicePixelRatio);

    this.hueHandle = document.createElement('div');
    this.hueHandle.classList.add('hue-handle');
    this.panel.append(this.hueHandle);

    this.fields = document.createElement('div');
    this.fields.classList.add('fields');
    this.panel.append(this.fields);

    this.fieldChangeHandler = genEvtHandler(this, this._onValueChanged);
    this.hexChangeHandler = genEvtHandler(this, this._onHexChanged);
    this.downHandler = genEvtHandler(this, this._onMouseDown);
    this.moveHandler = genEvtHandler(this, this._onMouseMove);
    this.upHandler = genEvtHandler(this, this._onMouseUp);

    this.rField = new ui.NumberField({
        precision : 1,
        step : 1,
        min : 0,
        max : 255
    });
    this.rField.renderChanges = false;
    this.rField.placeholder = 'r';
    this.rField.on('change', this.fieldChangeHandler);
    this.fields.appendChild(this.rField.element);

    this.gField = new ui.NumberField({
        precision : 1,
        step : 1,
        min : 0,
        max : 255
    });
    this.gField.renderChanges = false;
    this.gField.placeholder = 'g';
    this.gField.on('change', this.fieldChangeHandler);
    this.fields.appendChild(this.gField.element);

    this.bField = new ui.NumberField({
        precision : 1,
        step : 1,
        min : 0,
        max : 255
    });
    this.bField.renderChanges = false;
    this.bField.placeholder = 'b';
    this.bField.on('change', this.fieldChangeHandler);
    this.fields.appendChild(this.bField.element);

    this.hexField = new ui.TextField({});
    this.hexField.renderChanges = false;
    this.hexField.placeholder = '#';
    this.hexField.on('change', this.hexChangeHandler);
    this.fields.appendChild(this.hexField.element);

    // hook up mouse handlers
    this.colorRect.element.addEventListener('mousedown', this.downHandler);
    this.hueRect.element.addEventListener('mousedown', this.downHandler);

    this._generateHue(this.hueRect);
    this._hsv = [-1, -1, -1];
    this._storeHsv = [0, 0, 0];
    this._dragMode = 0;
    this.changing = false;
};

ColorPicker.prototype = {
    _generateHue : function (canvas) {
        var ctx = canvas.element.getContext('2d');
        var w = canvas.element.width;
        var h = canvas.element.height;
        var gradient = ctx.createLinearGradient(0, 0, 0, h);
        for (var t=0; t<=6; t+=1) {
            gradient.addColorStop(t / 6, Helpers.rgbaStr(hsv2rgb([t / 6, 1, 1])));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },

    _generateGradient : function (canvas, clr) {
        var ctx = canvas.element.getContext('2d');
        var w = canvas.element.width;
        var h = canvas.element.height;

        var gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, Helpers.rgbaStr([255, 255, 255, 255]));
        gradient.addColorStop(1, Helpers.rgbaStr([clr[0], clr[1], clr[2], 255]));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 255)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },

    _onValueChanged : function() {
        if (!this.changing) {
            var rgb = [this.rField.value,
                       this.gField.value,
                       this.bField.value];
            this.hsv = rgb2hsv(rgb);
            this.emit('change', this.color);
        }
    },

    _onHexChanged : function() {
        if (!this.changing) {
            var hex = this.hexField.value.trim().toLowerCase();
            if (/^([0-9a-f]{2}){3,4}$/.test(hex)) {
                var rgb = [ parseInt(hex.substring(0, 2), 16),
                            parseInt(hex.substring(2, 4), 16),
                            parseInt(hex.substring(4, 6), 16) ];
                this.hsv = rgb2hsv(rgb);
                this.emit('change', this.color);
            }
        }
    },

    _onMouseDown : function(evt) {
        if (evt.currentTarget === this.colorRect.element) {
            this._dragMode = 1;     // drag color
        }
        else {
            this._dragMode = 2;     // drag hue
        }

        this._storeHsv = this._hsv.slice();
        this._onMouseMove(evt);

        // hook up mouse
        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('mouseup', this.upHandler);
    },

    _onMouseMove : function(evt) {
        var newhsv;
        if (this._dragMode === 1) {
            var rect = this.colorRect.element.getBoundingClientRect();
            var s = pc.math.clamp((evt.pageX - rect.left) / rect.width, 0, 1);
            var v = pc.math.clamp((evt.pageY - rect.top) / rect.height, 0, 1);
            newhsv = [this.hsv[0], s, 1 - v];
        } else {
            var rect = this.hueRect.element.getBoundingClientRect();
            var h = pc.math.clamp((evt.pageY - rect.top) / rect.height, 0, 1);
            newhsv = [h, this.hsv[1], this.hsv[2]];
        }
        if (newhsv[0] !== this._hsv[0] ||
            newhsv[1] !== this._hsv[1] ||
            newhsv[2] !== this._hsv[2]) {
            this.hsv = newhsv;
        }
    },

    _onMouseUp : function(evt) {
        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('mouseup', this.upHandler);

        if (this._storeHsv[0] !== this._hsv[0] ||
            this._storeHsv[1] !== this._hsv[1] ||
            this._storeHsv[2] !== this._hsv[2]) {
                this.emit('change', this.color);
        }
    },

    __proto__ : Events.prototype,
};

Object.defineProperty(ColorPicker.prototype, 'hsv', {
    get: function() {
        return this._hsv;
    },
    set: function(hsv) {

        if ((hsv[1] === 0 || hsv[2] === 0) && this._hsv[0] !== -1) {
            hsv[0] = this._hsv[0];
        }

        var rgb = hsv2rgb(hsv);
        var hueRgb = hsv2rgb([hsv[0], 1, 1]);

        // regenerate gradient canvas if hue changes
        if (hsv[0] !== this._hsv[0]) {
            this._generateGradient(this.colorRect, hueRgb);
        }

        var e = this.colorRect.element;
        var r = e.getBoundingClientRect();
        var w = r.width - 2;
        var h = r.height - 2;

        this.colorHandle.style.backgroundColor = Helpers.rgbaStr(rgb);
        this.colorHandle.style.left = e.offsetLeft - 8 + Math.floor(w * hsv[1]) + 'px';
        this.colorHandle.style.top = e.offsetTop - 8 + Math.floor(h * (1 - hsv[2])) + 'px';

        this.hueHandle.style.backgroundColor = Helpers.rgbaStr(hueRgb);
        this.hueHandle.style.top = e.offsetTop - 3 + Math.floor(140 * hsv[0]) + 'px';
        this.hueHandle.style.left = '150px';        

        this.changing = true;
        this.rField.value = rgb[0];
        this.gField.value = rgb[1];
        this.bField.value = rgb[2];
        this.hexField.value = Helpers.hexStr(rgb);
        this.changing = false;

        this._hsv = hsv;
    }
});

Object.defineProperty(ColorPicker.prototype, 'color', {
    get: function() {
        return hsv2rgb(this._hsv).map(function(v) { return v / 255; });
    },
    set: function(clr) {
        this.hsv = rgb2hsv(clr.map(function(v) { return v * 255; }));
    },
});

// gradient picker

editor.once('load', function() { 
    'use strict';

    // open the picker
    function open() {
        UI.overlay.hidden = false;
    }

    // close the picker
    function close() {
        UI.overlay.hidden = true;
    }

    // handle the picker being opened
    function onOpen() {
        window.addEventListener('mousemove', anchorsOnMouseMove);
        window.addEventListener('mouseup', anchorsOnMouseUp);
        UI.anchors.element.addEventListener('mousedown', anchorsOnMouseDown);
        editor.emit('picker:gradient:open');
        editor.emit('picker:open', 'gradient');
    };

    // handle the picker being closed
    function onClose() {
        STATE.hoveredAnchor = -1;
        window.removeEventListener('mousemove', anchorsOnMouseMove);
        window.removeEventListener('mouseup', anchorsOnMouseUp);
        UI.anchors.element.removeEventListener('mousedown', anchorsOnMouseDown);
        editor.emit('picker:gradient:close');
        editor.emit('picker:close', 'gradient');
    };

    function setValue(value, args) {
        // sanity checks mostly for script 'curve' attributes
        if (!(value instanceof Array) ||
            value.length !== 1 ||
            value[0].keys == undefined ||
            (value[0].keys.length !== 3 && value[0].keys.length !== 4))
            return;

        // store the curve type
        var comboItems = {
            0: 'Step',
            1: 'Linear',
            2: 'Spline',
        };
        STATE.typeMap = {
            0: pc.CURVE_STEP,
            1: pc.CURVE_LINEAR,
            2: pc.CURVE_SPLINE
        };
        // check if curve is using a legacy curve type
        if (value[0].type !== pc.CURVE_STEP &&
            value[0].type !== pc.CURVE_LINEAR &&
            value[0].type !== pc.CURVE_SPLINE) {
            comboItems[3] = 'Legacy';
            STATE.typeMap[3] = value[0].type;
        }
        UI.typeCombo._updateOptions(comboItems);
        UI.typeCombo.value = { 0:1, 1:3, 2:3, 3:3, 4:2, 5:0 }[value[0].type];

        // store the curves
        STATE.curves = [];
        value[0].keys.forEach(function (keys) {
            var curve = new pc.Curve(keys);
            curve.type = value[0].type;
            STATE.curves.push(curve);
        });

        // calculate the anchor times
        STATE.anchors = calcAnchorTimes();

        // select the anchor
        if (STATE.anchors.length === 0) {
            selectAnchor(-1);
        } else {
            selectAnchor(pc.math.clamp(STATE.selectedAnchor, 0, STATE.anchors.length - 1));
        }
    };

    function onDeleteKey() {
        if (STATE.selectedAnchor !== -1) {
            var deleteTime = STATE.anchors[STATE.selectedAnchor];
            STATE.selectedAnchor = -1;
            deleteAnchor(deleteTime);
        }
    };

    function onTypeChanged(value) {
        value = STATE.typeMap[value];
        var paths = [];
        var values = [];
        for (var i=0; i<STATE.curves.length; ++i) {
            paths.push(i.toString() + '.type');
            values.push(value);
        }
        editor.emit('picker:curve:change', paths, values);
    };

    function render() {
        renderGradient();
        renderAnchors();
    };

    function renderGradient() {
        var ctx = UI.gradient.element.getContext('2d');
        var w = UI.gradient.width;
        var h = UI.gradient.height;

        var s = STATE;

        // fill background
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, w, h);

        // fill gradient
        var gradient = ctx.createLinearGradient(0, 0, w, 0);
        for (var t=0; t<=w; t+=2) {

            var x = t / w;
            gradient.addColorStop(x, Helpers.rgbaStr(evaluateGradient(x), 255));
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    };

    function renderAnchors() {
        var ctx = UI.anchors.element.getContext('2d');
        var w = UI.anchors.width;
        var h = UI.anchors.height;

        ctx.fillStyle = CONST.bg;
        ctx.fillRect(0, 0, w, h);

        // render plain anchors
        for (var index=0; index<STATE.anchors.length; ++index) {

            if (index !== STATE.hoveredAnchor &&
                index !== STATE.selectedAnchor) {
                renderAnchor(ctx, STATE.anchors[index]);
            }
        }

        if ((STATE.hoveredAnchor !== -1) &&
            (STATE.hoveredAnchor !== STATE.selectedAnchor)) {
            renderAnchor(ctx, STATE.anchors[STATE.hoveredAnchor], "hovered");
        }

        if (STATE.selectedAnchor !== -1) {
            renderAnchor(ctx, STATE.anchors[STATE.selectedAnchor], "selected");
        }
    };

    function renderAnchor(ctx, time, type) {
        var coords = [time * UI.anchors.width, UI.anchors.height / 2];
        var radius = (type === "selected" ? CONST.selectedRadius : CONST.anchorRadius);
        var lineWidth = ctx.lineWidth;

        // html element px units are virtual pixel units. this maps html pixel units to
        // physical device pixel units
        var toDevice = function(value) {
            return value * window.devicePixelRatio;
        }

        ctx.lineWidth = toDevice(1);

        // render selected arrow
        if (type === "selected") {
            ctx.beginPath();
            ctx.rect(coords[0] - toDevice(2),
                     coords[1],
                     toDevice(4),
                     toDevice(-coords[1]));
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fill();
            ctx.strokeStyle = 'rgb(255, 255, 255)';
            ctx.stroke();
        }

        // render the colour circle and border
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], toDevice(radius), 0, 2 * Math.PI, false);
        ctx.fillStyle = Helpers.rgbaStr(evaluateGradient(time), 255);
        ctx.fill();
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.stroke();

        // render additional which selection highlight
        if (type === "selected" || type === "hovered") {
            ctx.beginPath();
            ctx.arc(coords[0], coords[1], toDevice(radius + 1), 0, 2 * Math.PI, false);
            ctx.strokeStyle = 'rgb(255, 255, 255)';
            ctx.stroke();
        }

        ctx.lineWidth = lineWidth;
    };

    function evaluateGradient(time, alphaOverride) {
        var result = [];
        for (var i=0; i<3; ++i)
        {
            result.push(STATE.curves[i].value(time));
        }

        if (alphaOverride) {
            result.push(alphaOverride);
        } else if (STATE.curves.length > 3) {
            result.push(STATE.curves[3].value(time));
        } else {
            result.push(1);
        }

        for (var i=0; i<result.length; ++i) {
            if (!isFinite(result[i]) || isNaN(result[i])) {
                var oops = STATE.curves[i].value(time);
            }
        }

        return result;
    };

    function calcAnchorTimes() {
        // get curve anchor points
        var times = [ ];
        for (var i=0; i<STATE.curves.length; i++) {
            var curve = STATE.curves[i];
            for (var j=0; j<curve.keys.length; ++j) {
                times.push(curve.keys[j][0]);
            }
        }

        // sort anchors and remove duplicates
        times.sort();
        times = times.filter(function(item, pos, ary) { return !pos || item != ary[pos-1]; });

        return times;
    };

    // helper function for calculating the normalized coordinate
    // x,y relative to rect
    function calcNormalizedCoord(x, y, rect) {
        return [(x - rect.left) / rect.width,
                (y - rect.top) / rect.height];
    }

    // get the bounding client rect minus padding
    function getClientRect(element) {
        var styles = window.getComputedStyle(element);

        var paddingTop = parseFloat(styles.paddingTop);
        var paddingRight = parseFloat(styles.paddingRight);
        var paddingBottom = parseFloat(styles.paddingBottom);
        var paddingLeft = parseFloat(styles.paddingLeft);

        var rect = element.getBoundingClientRect();

        return new DOMRect(rect.x + paddingLeft,
                           rect.y + paddingTop,
                           rect.width - paddingRight - paddingLeft,
                           rect.height - paddingTop - paddingBottom);
    }

    function anchorsOnMouseDown(e) {
        if (STATE.hoveredAnchor === -1) {
            // user clicked in empty space, create new anchor and select it
            var coord = calcNormalizedCoord(e.clientX,
                                            e.clientY,
                                            getClientRect(UI.anchors.element));
            insertAnchor(coord[0], evaluateGradient(coord[0]));
            selectAnchor(STATE.anchors.indexOf(coord[0]));
        } else if (STATE.hoveredAnchor !== STATE.selectedAnchor) {
            // select the hovered anchor
            selectAnchor(STATE.hoveredAnchor);
        }

        // drag the selected anchor
        dragStart();
        UI.draggingAnchor = true;
    };

    function anchorsOnMouseMove(e) {
        var coord = calcNormalizedCoord(e.clientX,
                                        e.clientY,
                                        getClientRect(UI.anchors.element));

        if (UI.draggingAnchor) {
            dragUpdate(pc.math.clamp(coord[0], 0, 1));
        } else if (coord[0] >= 0 &&
                   coord[0] <= 1 &&
                   coord[1] >= 0 &&
                   coord[1] <= 1) {
            var closest = -1;
            var closestDist = 0;
            for (var index=0; index<STATE.anchors.length; ++index) {
                var dist = Math.abs(STATE.anchors[index] - coord[0]);
                if (closest === -1 || dist < closestDist) {
                    closest = index;
                    closestDist = dist;
                }
            }

            var hoveredAnchor = (closest !== -1 && closestDist < 0.02) ? closest : -1;
            if (hoveredAnchor != STATE.hoveredAnchor) {
                selectHovered(hoveredAnchor);
                render();
            }
        } else if (STATE.hoveredAnchor !== -1) {
            selectHovered(-1);
            render();
        }
    };

    function anchorsOnMouseUp(e) {
        if (UI.draggingAnchor) {
            dragEnd();
            UI.draggingAnchor = false;
        }
    }

    function selectHovered(index) {
        STATE.hoveredAnchor = index;
        UI.anchors.element.style.cursor = (index === -1 ? '' : 'pointer');
    }

    function selectAnchor(index) {
        STATE.selectedAnchor = index;
        STATE.changing = true;
        if (index === -1) {
            UI.positionEdit.value = "";
            UI.positionSlider.value = "";
            UI.colorPicker.color = [0, 0, 0];
        } else {
            var time = STATE.anchors[index];
            UI.positionEdit.value = Math.round(time * 100);
            UI.positionSlider.value = time;
            STATE.selectedValue = evaluateGradient(time);
            UI.colorPicker.color = STATE.selectedValue;
        }
        STATE.changing = false;
        render();
    };

    function dragStart() {
        if (STATE.selectedAnchor === -1) {
            return;
        }
        var time = STATE.anchors[STATE.selectedAnchor];
        // make a copy of the curve data before editing starts
        STATE.keystore = [];
        for (var i=0; i<STATE.curves.length; ++i) {
            var keys = [];
            STATE.curves[i].keys.forEach(function(element) {
                if (element[0] !== time) {
                    keys.push([ element[0], element[1] ] );
                }
            } );
            STATE.keystore.push(keys);
        }
    }

    function dragUpdate(time) {
        if (STATE.selectedAnchor === -1) {
            return;
        }
        for (var i=0; i<STATE.curves.length; ++i) {
            var curve = STATE.curves[i];
            var keystore = STATE.keystore[i];

            // merge keystore with the drag anchor (ignoring existing anchors at
            // the current anchor location)
            curve.keys = keystore.map(function (element) { return [ element[0], element[1] ]; } )
                                 .filter(function (element) { return element[0] !== time; });
            curve.keys.push([time, STATE.selectedValue[i]]);
            curve.sort();
        }

        STATE.anchors = calcAnchorTimes();
        selectAnchor(STATE.anchors.indexOf(time));
    }

    function dragEnd() {
        if (STATE.selectedAnchor !== -1) {
            emitCurveChange();
        }
    }

    // insert an anchor at the given time with the given color
    function insertAnchor(time, color) {
        for (var i=0; i<STATE.curves.length; ++i) {
            var keys = STATE.curves[i].keys;

            var j=0;
            while (j<keys.length) {
                if (keys[j][0] >= time) {
                    break;
                }
                ++j;
            }

            if (j < keys.length && keys[j][0] === time) {
                keys[j][1] = color[i];
            } else {
                keys.splice(j, 0, [time, color[i]]);
            }
        }
        emitCurveChange();
    }

    // delete the anchor(s) at the given time
    function deleteAnchor(time) {
        for (var i=0; i<STATE.curves.length; ++i) {
            var curve = STATE.curves[i];

            for (var j=0; j<curve.keys.length; ++j) {
                if (curve.keys[j][0] === time) {
                    curve.keys.splice(j, 1);
                    break;
                }
            }
        }
        emitCurveChange();
    }

    function moveSelectedAnchor(time) {
        if (STATE.selectedAnchor !== -1) {
            dragStart();
            dragUpdate(time);
            dragEnd();
        }
    };

    function colorSelectedAnchor(clr) {
        if (STATE.selectedAnchor !== -1) {
            var time = STATE.anchors[STATE.selectedAnchor];

            for (var i=0; i<STATE.curves.length; ++i) {
                var curve = STATE.curves[i];
    
                for (var j=0; j<curve.keys.length; ++j) {
                    if (curve.keys[j][0] === time) {
                        curve.keys[j][1] = clr[i];
                        break;
                    }
                }
            }
            STATE.selectedValue = clr;
            emitCurveChange();
        }
    }

    function emitCurveChange() {
        var paths = [];
        var values = [];
        STATE.curves.forEach(function(curve, index) {
            paths.push('0.keys.' + index);
            var keys = [];
            curve.keys.forEach(function(key) {
                keys.push(key[0], key[1]);
            });
            values.push(keys);
        });
        editor.emit('picker:curve:change', paths, values);
    };

    // constants
    var CONST = {
        bg: '#293538',
        anchorRadius : 6,
        selectedRadius : 8,
    };

    // ui widgets
    var UI = {
        root : editor.call('layout.root'),
        overlay : new ui.Overlay(),
        panel : document.createElement('div'),
        gradient : new ui.Canvas(),
        anchors : new ui.Canvas(),
        footer : new ui.Panel(),
        typeLabel : new ui.Label( { text : 'Type' }),
        typeCombo : new ui.SelectField({
            options : { 0: 'placeholder' },
            type : 'number'
        }),
        positionLabel : new ui.Label( { text : 'Position' }),
        positionEdit : new ui.NumberField( { min : 0, max : 100, step : 1 } ),
        positionSlider : new ui.Slider( {  } ),
        colourPicker : null,
    };

    // current state
    var STATE = {
        curves : [],            // holds all the gradient curves (either 3 or 4 of them)
        keystore : [],          // holds the curve during edit
        anchors : [],           // holds the times of the anchors
        hoveredAnchor : -1,     // index of the hovered anchor
        selectedAnchor : -1,    // index of selected anchor
        selectedValue : [],     // value being dragged
        changing : false,       // UI is currently changing
        draggingAnchor : false,
        typeMap : { },          // map from curve type dropdown to engine curve enum
    };

    // initialize overlay
    UI.root.append(UI.overlay);
    UI.overlay.class.add('picker-gradient');
    UI.overlay.center = false;
    UI.overlay.transparent = true;
    UI.overlay.hidden = true;

    UI.overlay.on('show', function () {
        onOpen();
    });

    UI.overlay.on('hide', function () {
        onClose();
    });

    // panel
    UI.panel.classList.add('picker-gradient-panel');
    UI.overlay.append(UI.panel);

    // gradient
    UI.panel.appendChild(UI.gradient.element);
    UI.gradient.class.add('picker-gradient-gradient');
    UI.gradient.resize(UI.gradient.element.clientWidth * window.devicePixelRatio,
                       UI.gradient.element.clientHeight * window.devicePixelRatio);

    // anchors
    UI.panel.appendChild(UI.anchors.element);
    UI.anchors.class.add('picker-gradient-anchors');
    UI.anchors.resize(UI.anchors.element.clientWidth * window.devicePixelRatio,
                      UI.anchors.element.clientHeight * window.devicePixelRatio);

    // footer
    UI.panel.appendChild(UI.footer.element);
    UI.footer.append(UI.typeLabel);
    UI.footer.class.add('picker-gradient-footer');

    UI.footer.append(UI.typeCombo);
    UI.typeCombo.value = 1;
    UI.typeCombo.on('change', onTypeChanged);

    UI.footer.append(UI.positionLabel);

    UI.footer.append(UI.positionEdit);
    UI.positionEdit.style.width = '40px';
    UI.positionEdit.renderChanges = false;
    UI.positionEdit.on('change', function(value) { if (!STATE.changing) { moveSelectedAnchor(value/100); } } );

    // TODO: ideally this width wouldn't be specified.
    // can we use flexgrow for sizing instead?
    UI.footer.append(UI.positionSlider);
    UI.positionSlider.style.width = '84px';
    UI.positionSlider.on('start', function() { if (!STATE.changing) { dragStart(); } } );
    UI.positionSlider.on('change', function(value) { if (!STATE.changing) { dragUpdate(value); } } );
    UI.positionSlider.on('end', function() { if (!STATE.changing) { dragEnd(); } } );

    // construct the color picker
    UI.colorPicker = new ColorPicker(UI.panel);
    UI.colorPicker.on('change', colorSelectedAnchor);

    // esc to close
    editor.call('hotkey:register', 'picker:gradient:close', {
        key: 'esc',
        callback: close
    });

    editor.call('hotkey:register', 'gradient-anchor:delete', {
        key: 'delete',
        callback: onDeleteKey
    });

    editor.call('hotkey:register', 'gradient-anchor:delete', {
        key: 'backspace',
        ctrl: true,
        callback: onDeleteKey
    });

    // show the gradient picker
    editor.method('picker:gradient', function (value, args) {
        setValue(value, args);
        open();
    });

    editor.method('picker:gradient:set', function(value, args) {
        setValue(value, args);
    });

    editor.method('picker:gradient:rect', function () {
        return UI.overlay.rect;
    });

    editor.method('picker:gradient:position', function(x, y) {
        if (y + UI.panel.clientHeight > window.innerHeight) {
            y = window.innerHeight - UI.panel.clientHeight;
        }
        UI.overlay.position(x, y);
    });
});
