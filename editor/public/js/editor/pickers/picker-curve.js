editor.once('load', function() {
    'use strict';

    // used to disable event handlers
    var suspendEvents = false;

    // true while changing curves
    var changing = false;

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-curve');
    overlay.center = false;
    overlay.transparent = true;
    overlay.hidden = true;

    var root = editor.call('layout.root');
    root.append(overlay);

    overlay.on('hide', function () {
        editor.emit('picker:curve:close');
        cleanup();
    });

    // rectangular picker
    var panel = document.createElement('div');
    panel.classList.add('picker-curve-panel');
    overlay.append(panel);

    // header
    var header = new ui.Panel();
    header.class.add('picker-curve-header');

    panel.appendChild(header.element);

    header.append(new ui.Label({
        text: 'Type'
    }));


    // esc to close
    editor.call('hotkey:register', 'picker:curve:close', {
        key: 'esc',
        callback: function() {
            if (overlay.hidden)
                return;

            overlay.hidden = true;
        }
    });


    // type selector
    var fieldType = new ui.SelectField({
        options: {
            0: 'Linear',
            1: 'Smooth Step',
            2: 'Spline'
        },
        number: true
    });

    fieldType.style['font-size'] = '11px';
    fieldType.value = 1;

    fieldType.on('change', function (value) {
        if (suspendEvents) return;

        changing = true;

        curveType = value;

        editor.emit('picker:curve:change:start');

        // set type for each curve
        curves.forEach(function (curve, i) {
            curve.type = value;
            var path = i.toString() + '.type';
            editor.emit('picker:curve:change', path, value);
        });

        render();

        changing = false;
    });

    header.append(fieldType);

    // randomize
    var labelRandomize = new ui.Label({
        text: 'Randomize'
    });

    labelRandomize.style['margin-left'] = '25px';
    header.append(labelRandomize);

    var fieldRandomize = new ui.Checkbox();
    fieldRandomize.on('change', function (value) {
        if (suspendEvents) return;

        var i;

        changing = true;

        betweenCurves = value;

        editor.emit('picker:curve:change:start');
        editor.emit('picker:curve:change', '0.betweenCurves', betweenCurves);

        if (!betweenCurves) {
            // disable the secondary graph
            for (i = 0; i < numCurves; i++) {
                toggleCurve(curves[i + numCurves], false);
            }
        } else {
            // enable the secondary graphs if their respective primary graphs are enabled
            for (i = 0; i < numCurves; i++) {
                // we might have a different value for the secondary graphs
                // when we re-enable betweenCurves so fire change event
                // to make sure the different values are saved
                onCurveKeysChanged(curves[i + numCurves]);

                var isEnabled = enabledCurves.indexOf(curves[i]) >= 0;
                toggleCurve(curves[i + numCurves], false);
                if (isEnabled) {
                    toggleCurve(curves[i + numCurves], true);
                }
            }
        }

        changing = false;
    });

    header.append(fieldRandomize);

    // curve toggles
    var curveToggles = [];

    var onCurveToggleClick = function () {
        var i = curveToggles.indexOf(this);
        var enabled = !this.class.contains('active');
        if (enabled) {
            this.class.add('active');
        } else {
            this.class.remove('active');
        }

        toggleCurve(curves[i], enabled);
    };

    var curveTogglesClasses = ['third', 'second', 'first'];
    for (var i = 0; i < 3; i++) {
        var btn = new ui.Button();
        btn.class.add('picker-curve-toggle', 'active', curveTogglesClasses[i]);
        curveToggles.splice(0, 0, btn);
        header.append(btn);

        btn.on('click', onCurveToggleClick.bind(btn));
    }

    // canvas
    var canvas = new ui.Canvas();
    canvas.resize(panel.clientWidth, 200);
    panel.appendChild(canvas.element);

    // gradient canvas
    var gradientCanvas = new ui.Canvas();
    gradientCanvas.resize(panel.clientWidth, 32);
    gradientCanvas.style.display = 'block';
    panel.appendChild(gradientCanvas.element);

    // footer
    var footer = new ui.Panel();
    footer.class.add('picker-curve-footer');
    panel.appendChild(footer.element);

    // time input field
    var fieldTime = new ui.NumberField({
        min: 0,
        max: 1,
        step: 0.1
    });

    fieldTime.renderChanges = false;
    fieldTime.value = 0;
    fieldTime.on('change', onFieldChanged);
    fieldTime.flexGrow = 1;
    fieldTime.placeholder = 'Time';
    footer.append(fieldTime);

    // value input field
    var fieldValue = new ui.NumberField();
    fieldValue.renderChanges = false    ;
    fieldValue.value = 0;
    fieldValue.on('change', onFieldChanged);
    fieldValue.flexGrow = 1;
    fieldValue.placeholder = 'Value';
    footer.append(fieldValue);

    // called when time or value field change value
    function onFieldChanged () {
        if (suspendEvents || !selectedAnchor) return;

        changing = true;

        var newAnchorTime = fieldTime.value;
        var newAnchorValue = fieldValue.value;

        // start editing
        editor.emit('picker:curve:change:start');

        // set time for the selected anchor
        updateAnchor(selectedCurve, selectedAnchor, newAnchorTime, newAnchorValue);

        collapseAnchors();

        if (newAnchorValue > verticalTopValue || newAnchorValue < verticalBottomValue) {
            resetZoom();
        }

        render();

        changing = false;
    }

    // reset zoom
    var btnResetZoom = new ui.Button({
        text: 'Reset Zoom'
    });

    btnResetZoom.flexGrow = 1;

    btnResetZoom.on('click', function () {
        if (resetZoom()) {
            render();
        }
    });

    footer.append(btnResetZoom);

    // reset curve
    var btnResetCurve = new ui.Button({
        text: 'Reset Curve'
    });

    btnResetCurve.flexGrow = 1;

    btnResetCurve.on('click', function () {
        // reset keys of selected curve
        if (selectedCurve) {
            changing = true;

            // start editing
            editor.emit('picker:curve:change:start');

            resetCurve(selectedCurve);

            render();

            changing = false;
        }
    });

    footer.append(btnResetCurve);

    var context = canvas.element.getContext('2d');

    // canvas variables
    var padding = 10;
    var axisSpacing = 20;
    var anchorRadius = 4;
    var curveHoverRadius = 8;
    var anchorHoverRadius = 8;
    var textSize = 10;

    // color variables
    var colors = {
        bg: '#293538',
        gridLines: '#20292b',
        anchors: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)'],
        curves: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(133, 133, 252)'],
        curveFilling: ['rgba(255, 0, 0, 0.5)', 'rgba(0, 255, 0, 0.5)', 'rgba(133, 133, 252, 0.5)'],
        text: 'white',
        highlightedLine: 'white'
    };

    // input related variables
    var curves = []; // holds all the curves
    var enabledCurves = []; // holds the rendered order of the curves
    var numCurves; // number of pairs of curves
    var betweenCurves = false;
    var curveType = 1;
    var curveNames = [];
    var verticalValue = 5;
    var verticalTopValue = 5;
    var verticalBottomValue = -5;
    var maxVertical = null;
    var minVertical = null;
    var hoveredAnchor = null;
    var hoveredCurve = null;
    var selectedAnchor = null;
    var selectedAnchorIndex = -1;
    var selectedCurve = null;
    var selectedCurveIndex = -1;
    var dragging = false;
    var gradient = false;

    function cleanup () {
        selectedCurveIndex = -1;
        selectedAnchorIndex = -1;
        changing = false;
        dragging = false;
    }

    function resetCurve (curve) {
        curve.keys.length = 0;
        createAnchor(curve, 0, 0);
        updateFields([0, 0]);
        setSelected(curve, null);

        // reset secondary curve too
        var otherCurve = getOtherCurve(curve);
        if (otherCurve) {
            otherCurve.keys.length = 0;
            createAnchor(otherCurve, 0, 0);
        }
    }

    // Sets value for the picker and render it
    function setValue (value, args) {
        // sanity checks mostly for script 'curve' attributes
        if (! value instanceof Array || value.length === 0 || value[0].keys === undefined)
            return;

        suspendEvents = true;
        numCurves = value[0].keys[0].length ? value[0].keys.length : 1;

        betweenCurves = value[0].betweenCurves;
        fieldRandomize.value = betweenCurves;

        curveType = value[0].type;
        fieldType.value = curveType;

        gradient = args.gradient !== undefined ? args.gradient : false;
        gradientCanvas.style.display = gradient ? 'block' : 'none';
        fieldRandomize.hidden = gradient || args.hideRandomize;
        labelRandomize.hidden = gradient || args.hideRandomize;

        maxVertical = args.max;
        fieldValue.max = args.max;

        minVertical = args.min;
        fieldValue.min = args.min;

        verticalValue = args.verticalValue !== undefined ? args.verticalValue : 5;

        verticalTopValue = args.max !== undefined ? Math.min(verticalValue, args.max) : verticalValue;
        verticalBottomValue = args.min !== undefined ? Math.max(-verticalValue, args.min) : -verticalValue;

        curveNames = args.curves || [];
        for (var i = 0; i < 3; i++) {
            if (i < numCurves) {
                curveToggles[i].text = curveNames[i];
                curveToggles[i].class.remove('hidden');
            } else {
                curveToggles[i].class.add('hidden');
            }
        }

        curves.length = 0;
        value.forEach(function (data) {
            if (numCurves === 1) {
                var c = new pc.Curve(data.keys);
                c.type = curveType;
                curves.push(c);
            } else {
                data.keys.forEach(function (keys) {
                    var c = new pc.Curve(keys);
                    c.type = curveType;
                    curves.push(c);
                });
            }
        });

        enabledCurves.length = 0;
        for (var i = 0; i < numCurves; i++)  {
            if (curveToggles[i].class.contains('active')) {
                enabledCurves.push(curves[i]);
                if (betweenCurves) {
                    enabledCurves.push(curves[i+numCurves]);
                }
            }
        }

        // try to select the same curve / anchor as the ones selected before setting the value
        var selCurve = selectedCurveIndex >= 0 ? curves[selectedCurveIndex] : enabledCurves[numCurves - 1];
        var selAnchor = selectedAnchorIndex >= 0 ? (selCurve ? selCurve.keys[selectedAnchorIndex] : null) : null;
        setSelected(selCurve, selAnchor);

        setHovered(null, null);

        suspendEvents = false;

        if (shouldResetZoom()) {
            resetZoom();
        }

        render();
    }

    function render () {
        renderGrid();
        renderCurves();
        renderHighlightedAnchors();

        if (gradient) {
            renderColorGradient();
        }
    }

    function renderGrid() {
        var i;

        // draw background
        context.fillStyle = colors.bg;
        context.fillRect(0, 0, canvas.width, canvas.height);

        // draw grid
        for (i=0; i<5; i++) {
            var y = gridTop() + gridHeight() * i / 4;
            drawLine([gridLeft(), y], [gridRight(), y], colors.gridLines);
        }

        for (i=0; i<11; i++) {
            var x = gridLeft() + gridWidth() * i / 10;
            drawLine([x, gridTop()], [x, gridBottom()], colors.gridLines);
        }

        // draw vertical axis values
        var left = gridLeft() - textSize * 2;
        drawText(verticalTopValue, left, gridTop() + textSize * 0.5);
        drawText(+Number((verticalTopValue + verticalBottomValue) * 0.5).toFixed(1), left, gridTop() + (gridHeight() + textSize) * 0.5);
        drawText(verticalBottomValue, left, gridBottom() + textSize * 0.5);

        // draw horizontal axis values
        drawText('0.0', left + textSize * 2, gridBottom() + 2 * textSize);
        drawText('1.0', gridRight() - textSize * 2, gridBottom() + 2 * textSize);
    }

    function gridWidth () {
        return canvas.width - 2 * padding - axisSpacing;
    }

    function gridHeight () {
        return canvas.height - 2 * padding - axisSpacing;
    }

    function gridLeft () {
        return padding + axisSpacing;
    }

    function gridRight () {
        return gridLeft() + gridWidth();
    }

    function gridTop () {
        return padding;
    }

    function gridBottom () {
        return gridTop() + gridHeight();
    }

    function drawLine (start, end, color) {
        context.beginPath();
        context.moveTo(start[0], start[1]);
        context.lineTo(end[0], end[1]);
        context.strokeStyle = color;
        context.stroke();
    }

    // Draws text at the specified coordinates
    function drawText (text, x, y) {
        context.font = textSize + 'px Verdana';
        context.fillStyle = colors.text;
        context.fillText(text.toString(), x, y);
    }

    function renderCurves() {
        // holds indices of graphs that were rendered to avoid
        // rendering the same graphs twice
        var renderedCurveIndices = {};

        // // draw curves in the order in which they were enabled
        for (var i = 0; i < enabledCurves.length; i++) {
            var curve = enabledCurves[i];
            var index = curves.indexOf(curve);

            if (!renderedCurveIndices[index]) {
                renderedCurveIndices[index] = true;

                var otherCurve = getOtherCurve(curve);
                drawCurvePair(curve, otherCurve);

                drawCurveAnchors(curve);

                if (otherCurve) {
                    var otherIndex = curves.indexOf(otherCurve);
                    if (!renderedCurveIndices[otherIndex]) {
                        drawCurveAnchors(otherCurve);
                        renderedCurveIndices[otherIndex] = true;
                    }
                }
            }
        }
    }

    // If the specified curve is the primary returns the secondary
    // otherwise if the specified curve is the secondary returns the primary
    function getOtherCurve (curve) {
        if (betweenCurves) {
            var ind = curves.indexOf(curve);
            if (ind < numCurves) {
                return curves[numCurves + ind];
            } else {
                return curves[ind - numCurves];
            }
        }
    }

    // Draws a pair of curves with their in-between filling. If the second
    // curve is null then only the first curve will be rendered
    function drawCurvePair (curve1, curve2) {
        var colorIndex = curves.indexOf(curve1) % numCurves;

        context.strokeStyle = colors.curves[colorIndex];
        context.fillStyle = colors.curveFilling[colorIndex];
        context.beginPath();

        var time = 0;
        var value = curve1.value(time);
        var x;
        var coords = calculateAnchorCoords([time, value]);
        context.moveTo(coords[0], coords[1]);

        var precision = 1;
        var width = canvas.width;

        for (x = precision; x <= Math.ceil(width / precision); x++) {
            time = x * precision / width;
            value = curve1.value(time);
            coords = calculateAnchorCoords([time, value]);
            context.lineTo(coords[0], coords[1]);
        }

        if (curve2) {
           for (x = Math.ceil(width / precision); x >= 0; x--) {
                time = x * precision / width;
                value = curve2.value(time);
                coords = calculateAnchorCoords([time, value]);
                context.lineTo(coords[0], coords[1]);
            }

            context.closePath();
            context.fill();
        }

        context.stroke();
    }

    // Returns the coordinates of the specified anchor on this grid
    function calculateAnchorCoords (anchor) {
        var time = anchor[0];
        var value = anchor[1];

        var coords = [0, 0];
        coords[0] = gridLeft() + time * gridWidth();
        coords[1] = pc.math.lerp(gridTop(), gridTop() + gridHeight(), (value - verticalTopValue) / (verticalBottomValue - verticalTopValue));

        return coords;
    }

    // Draws the anchors for the specified curve
    function drawCurveAnchors (curve) {
        var colorIndex = curves.indexOf(curve) % numCurves;
        curve.keys.forEach(function (anchor) {
            if (anchor !== hoveredAnchor && anchor !== selectedAnchor) {
                var color = colors.anchors[colorIndex];
                var lineColor = colors.curves[colorIndex];
                drawAnchor(calculateAnchorCoords(anchor), color, lineColor);
            }
        });
    }

    // Draws an anchor point at the specified coordinates
    function drawAnchor (coords, fillColor, lineColor) {
        context.beginPath();
        context.arc(coords[0], coords[1], anchorRadius, 0, 2 * Math.PI, false);
        context.fillStyle = fillColor;
        context.fill();
        var lineWidth = context.lineWidth;
        context.lineWidth = 2;
        context.strokeStyle = lineColor;
        context.stroke();
        context.lineWidth = lineWidth;
    }

    function renderHighlightedAnchors() {
        // draw highlighted anchors on top of the others
        if (hoveredAnchor) {
            drawAnchor(
                calculateAnchorCoords(hoveredAnchor),
                colors.anchors[curves.indexOf(hoveredCurve) % numCurves],
                colors.highlightedLine
            );
        }

        if (selectedAnchor && selectedAnchor !== hoveredAnchor) {
            drawAnchor(
                calculateAnchorCoords(selectedAnchor),
                colors.anchors[curves.indexOf(selectedCurve) % numCurves],
                colors.highlightedLine
            );
        }
    }

    // Draws color gradient for a set of curves
    function renderColorGradient () {
        var ctx = gradientCanvas.element.getContext('2d');
        var t;
        var rgb = [];
        var precision = 1;
        var color = new pc.Color();

        ctx.lineWidth = gradientCanvas.height;

        var keys = [];
        for (var i = 0; i < curves.length; i++) {
            var k = curves[i].keys;
            var ka = [];
            for (var j = 0, len = k.length; j < len; j++ ) {
                ka.push(k[j][0], k[j][1]);
            }
            keys.push(ka);
        }

        var curveset = new pc.CurveSet(keys);
        curveset.type = curveType;

        for (t = precision; t < gradientCanvas.width; t += precision) {
            curveset.value(t / gradientCanvas.width, rgb);
            color.set(rgb[0], rgb[1], rgb[2]);

            ctx.beginPath();
            ctx.moveTo(t - precision, gradientCanvas.height * 0.5);
            ctx.lineTo(t, gradientCanvas.height * 0.5);
            ctx.strokeStyle = color.toString();
            ctx.stroke();
        }
    }

    // Calculate the anchor value based on the specified coordinates
    function calculateAnchorValue (coords) {
        var top = gridTop();
        var height = gridHeight();

        return pc.math.lerp(verticalTopValue, verticalBottomValue, (coords[1] - top) / height);
    }

    // Calculate the anchor time based on the specified coordinates
    function calculateAnchorTime (coords) {
        return pc.math.clamp((coords[0] - gridLeft()) / gridWidth(), 0, 1);
    }

    function resetZoom () {
        var minMax = getCurvesMinMax(enabledCurves);

        var oldVerticalTop = verticalTopValue;
        var oldVerticalBottom = verticalBottomValue;

        var maxLimit = Math.ceil(2 * Math.max(Math.abs(minMax[0]), Math.abs(minMax[1])));
        if (maxLimit === 0) {
            maxLimit = verticalValue;
        }

        verticalTopValue = maxLimit;
        if (maxVertical != null) {
            verticalTopValue = Math.min(maxLimit, maxVertical);
        }

        verticalBottomValue = -verticalTopValue;
        if (minVertical != null) {
            verticalBottomValue = Math.max(minVertical, verticalBottomValue);
        }

        return oldVerticalTop != verticalTopValue || oldVerticalBottom != verticalBottomValue;
    }

    function getCurvesMinMax (curves) {
        var maxValue = -Infinity;
        var minValue = Infinity;

        curves.forEach(function (curve) {
            curve.keys.forEach(function (anchor) {
                var value = anchor[1];
                if (value > maxValue) {
                    maxValue = value;
                }

                if (value < minValue) {
                    minValue = value;
                }
            });
        });

        if (maxValue == -Infinity) {
            maxValue = maxVertical != null ? maxVertical : verticalValue;
        }

        if (minValue == Infinity) {
            minValue = minVertical != null ? minVertical : -verticalValue;
        }

        return [minValue, maxValue];
    }

    function updateFields (anchor) {
         suspendEvents = true;
         fieldTime.value = anchor ? anchor[0].toFixed(2) : 0;
         fieldValue.value = anchor ? anchor[1].toFixed(2) : 0;
         suspendEvents = false;
    }

    function getTargetCoords (e) {
        var rect = canvas.element.getBoundingClientRect();
        var left = Math.floor(rect.left);
        var top = Math.floor(rect.top);

        return [e.clientX - left, e.clientY - top];
    }

    // Returns true if the specidifed coordinates are within the grid bounds
    function areCoordsInGrid (coords) {
        return coords[0] >= gridLeft() &&
               coords[0] <= gridRight() &&
               coords[1] >= gridTop() &&
               coords[1] <= gridBottom();
    }

    function areCoordsClose (coords1, coords2, range) {
        return Math.abs(coords1[0] - coords2[0]) <= range &&
               Math.abs(coords1[1] - coords2[1]) <= range;
    }

    // If there are any anchors with the same time, collapses them to one
    function collapseAnchors () {
        var changedCurves = {};

        enabledCurves.forEach(function (curve) {
            for (var i = curve.keys.length - 1; i > 0; i--) {
                var key = curve.keys[i];
                var prevKey = curve.keys[i-1];
                if (key[0].toFixed(2) === prevKey[0].toFixed(2)) {
                    curve.keys.splice(i, 1);

                    changedCurves[i] = true;

                    if (selectedAnchor === key) {
                        setSelected(selectedCurve, prevKey);
                    }

                    if (hoveredAnchor === key) {
                        setHovered(hoveredCurve, prevKey);
                    }
                }
            }
        });


        for (var index in changedCurves) {
            var curve = curves[parseInt(index)];
            if (curve) {
                onCurveKeysChanged(curve);
            }
        }
    }

    // Creates and returns an anchor and fires change event
    function createAnchor (curve, time, value) {
        var anchor = curve.add(time, value);
        onCurveKeysChanged(curve);
        return anchor;
    }

    // Updates the time / value of an anchor and fires change event
    function updateAnchor (curve, anchor, time, value) {
        anchor[0] = time;
        anchor[1] = value;
        curve.sort();

        // reset selected anchor index because it
        // might have changed after sorting the curve keys
        if (selectedCurve === curve && selectedAnchor) {
            selectedAnchorIndex = curve.keys.indexOf(selectedAnchor);
        }

        onCurveKeysChanged(curve);
    }

    // Deletes an anchor from the curve and fires change event
    function deleteAnchor (curve, anchor) {
        var index = curve.keys.indexOf(anchor);
        if (index >= 0) {
            curve.keys.splice(index, 1);
        }

        // Have at least one key in the curve
        if (curve.keys.length === 0) {
            createAnchor(curve, 0, 0);
        } else {
            onCurveKeysChanged(curve);
        }
    }

    function getKeysPath (curve) {
        var curveIndex = curves.indexOf(curve);
        if (numCurves > 1) {
            return curveIndex >= numCurves ? '1.keys.' + (curveIndex - numCurves) : '0.keys.' + curveIndex;
        } else {
            return curveIndex === 0 ? '0.keys' : '1.keys';
        }
    }

    function serializeCurveKeys (curve) {
        var result = [];
        curve.keys.forEach(function (k) {
            result.push(k[0], k[1]);
        });
        return result;
    }

    function onCurveKeysChanged (curve) {
        editor.emit('picker:curve:change', getKeysPath(curve), serializeCurveKeys(curve));
    }

    // Make the specified curve appear in front of the others
    function sendCurveToFront (curve) {
        var index = enabledCurves.indexOf(curve);
        if (index >= 0) {
            enabledCurves.splice(index, 1);
        }

        enabledCurves.push(curve);
    }

    // Sets the hovered graph and anchor
    function setHovered (curve, anchor) {
        hoveredCurve = curve;
        hoveredAnchor = anchor;

        // Change the mouse cursor to a pointer
        if (curve || anchor) {
            canvas.element.style.cursor = 'pointer';
            updateFields(anchor);
        } else {
            canvas.element.style.cursor = 'default';
            updateFields(selectedAnchor);
        }
    }

    // Sets the selected anchor and curve
    function setSelected (curve, anchor) {
        selectedCurve = curve;
        selectedAnchor = anchor;

        updateFields(anchor);

        // make the selected curve appear in front of all the others
        if (curve) {
            // set selected curve index
            selectedCurveIndex = curves.indexOf(curve);

            // set selected anchor index
            selectedAnchorIndex = anchor ? curve.keys.indexOf(anchor) : -1;

            // render curve pair in front of the others
            var otherCurve = getOtherCurve(curve);
            if (otherCurve) {
                sendCurveToFront(otherCurve);
            }

            sendCurveToFront(curve);
        } else {
            selectedCurveIndex = -1;
            selectedAnchorIndex = -1;
        }
    }

    // Return the hovered anchor and graph
    function getHoveredAnchor (coords) {
        var x,y;

        var result = {
            graph: null,
            anchor: null
        };

        var hoveredTime = calculateAnchorTime(coords);

        // go through all the curves from front to back
        // and check if the mouse cursor is hovering on them
        for (var j = enabledCurves.length - 1; j >= 0; j--) {
            var curve = enabledCurves[j];

            if (!result.curve) {
                // get the value at the current hovered time
                var value = curve.value(hoveredTime);

                // convert hoveredTime, value to coords
                var curvePointCoords = calculateAnchorCoords([hoveredTime, value]);

                // check coords are close to a radius
                x = coords[0] - curvePointCoords[0];
                y = coords[1] - curvePointCoords[1];

                if (areCoordsClose(coords, curvePointCoords, curveHoverRadius)) {
                    result.curve = curve;
                }
            }

            for (var i = 0, imax = curve.keys.length; i < imax; i++) {
                var anchor = curve.keys[i];
                var anchorCoords = calculateAnchorCoords(anchor);

                if (areCoordsClose(coords, anchorCoords, anchorHoverRadius)) {
                    result.anchor = anchor;
                    result.curve = curve;
                    return result;
                }
            }
        }

        return result;
    }

    // Enables / disables a curve
    function toggleCurve (curve, toggle) {
        if (toggle) {
            // when we enable a curve make it the selected one
            setSelected(curve, null);
        } else {
            // remove the curve from the enabledCurves array
            var index = enabledCurves.indexOf(curve);
            if (index >= 0) {
                enabledCurves.splice(index, 1);
            }

            // remove it's matching curve too
            var otherCurve = getOtherCurve(curve);
            if (otherCurve) {
                index = enabledCurves.indexOf(otherCurve);
                if (index >= 0) {
                    enabledCurves.splice(index, 1);
                }
            }

            // if the selected curve was disabled select the next enabled one
            if (selectedCurve === curve || selectedCurve === otherCurve) {
                setSelected(null, null);

                if (enabledCurves.length) {
                    selectedCurve = enabledCurves[enabledCurves.length - 1];
                    selectedCurveIndex = curves.indexOf(selectedCurve);

                    // make sure we select the primary curve
                    if (betweenCurves && selectedCurveIndex >= numCurves) {
                        selectedCurveIndex -= numCurves;
                        selectedCurve = curves[selectedCurveIndex];
                    }
                }
            }

            if (hoveredCurve === curve || hoveredCurve === otherCurve) {
                hoveredCurve = null;
            }
        }

        if (shouldResetZoom()) {
            resetZoom();
        }

        render();
    }

    // Returns true if it would be a good idea to reset the zoom
    function shouldResetZoom () {
        var minMax = getCurvesMinMax(enabledCurves);

        // if min value is less than the bottom vertical value...
        if (minMax[0] < verticalBottomValue) {
            return true;
        }

        // ... or if max is bigger than the top vertical value...
        if (minMax[1] > verticalTopValue) {
            return true;
        }

        // // ... or if min and max are between the [25%, 75%] interval of the editor, return true
        // if (minMax[1] < Math.ceil(pc.math.lerp(verticalBottomValue, verticalTopValue, 0.75)) &&
        //     minMax[0] > Math.ceil(pc.math.lerp(verticalBottomValue, verticalTopValue, 0.25))) {
        //     return true;
        // }

        // don't reset zoom
        return false;
    }

    function toggleTextSelection (enable) {
        if (enable) {
            document.body.classList.remove('noSelect');
        } else {
            if (!document.body.classList.contains('noSelect')) {
                document.body.classList.add('noSelect');
            }
        }
    }

    // Handles mouse down
    canvas.element.addEventListener('mousedown', function (e) {
        if (e.target !== canvas.element) {
            return;
        }

        dragging = true;
        changing = true;

        toggleTextSelection(false);

        var point = getTargetCoords(e);
        var inGrid = areCoordsInGrid(point);

        editor.emit('picker:curve:change:start');

        // collapse anchors on mouse down because we might
        // have placed another anchor on top of another by directly
        // editing its time through the input fields
        collapseAnchors();

        // select or add anchor on left click
        if (e.button === 0) {
            // if we are clicking on an empty area
            if (!hoveredAnchor) {

                if (!inGrid) {
                    return;
                }

                var curve = hoveredCurve || selectedCurve;

                // create a new anchor
                if (curve) {

                    var time = calculateAnchorTime(point);
                    var value = calculateAnchorValue(point);
                    var anchor = createAnchor(curve, time, value);

                    // select the new anchor and make it hovered
                    setSelected(curve, anchor);
                    setHovered(curve, anchor);
                }
            } else {
                // if we are hovered over a graph or an anchor then select it
                setSelected(hoveredCurve, hoveredAnchor);
            }
        }
        else {
            // delete anchor on right click
            if (hoveredAnchor) {
                deleteAnchor(hoveredCurve, hoveredAnchor);

                // clean up selected anchor
                if (selectedAnchor == hoveredAnchor) {
                    setSelected(selectedCurve, null);
                }

                // clean up hovered anchor
                setHovered(null, null);
            }
        }

        render();
    });

    // Handles mouse move
    panel.addEventListener('mousemove', function (e) {
        if (dragging && e.target !== canvas.element) {
            e.preventDefault();
            return false;
        }

        var coords = getTargetCoords(e);

        // if we are dragging the selected anchor
        if (selectedAnchor && dragging) {
            // clamp coords to grid
            coords[0] = pc.math.clamp(coords[0], gridLeft(), gridRight());
            coords[1] = pc.math.clamp(coords[1], gridTop(), gridBottom());

            var time = calculateAnchorTime(coords);
            var value = calculateAnchorValue(coords);

            // if there is another point with the same time
            // then make the two points have the same values
            var keys = selectedCurve.keys;
            for (var i = 0, len = keys.length; i < len; i++) {
                if (keys[i] !== selectedAnchor && keys[i][0] === time) {
                    value = keys[i][1];
                }
            }

            updateAnchor(selectedCurve, selectedAnchor, time, value);
            updateFields(selectedAnchor);
            render();
        } else {
            // mouse is moving without selected anchors so just check for hovered anchors or hovered curves
            var hovered = getHoveredAnchor(coords);
            if (hovered.curve != hoveredCurve || hovered.anchor != hoveredAnchor) {
                setHovered(hovered.curve, hovered.anchor);
                render();
            }
        }
    });

    // Handles mouse up
    panel.addEventListener('mouseup', function (e) {
        toggleTextSelection(true);

        if (changing) {
            // collapse anchors on mouse up because we might have
            // placed an anchor on top of another one
            collapseAnchors();

            dragging = false;
            changing = false;
        }
    });

    // call picker
    editor.method('picker:curve', function (value, args) {
        // show overlay
        overlay.hidden = false;

        suspendEvents = true;
        curveToggles.forEach(function (toggle) {
            toggle.class.add('active');
        });
        suspendEvents = false;

        setValue(value, args || {});
    });

    editor.method('picker:curve:close', function () {
        overlay.hidden = true;
        cleanup();

        toggleTextSelection(true);
    });

    editor.method('picker:curve:rect', function () {
        return overlay.rect;
    });

    // position picker
    editor.method('picker:curve:position', function (x, y) {
        // limit to bottom of screen
        if (y + panel.clientHeight > window.innerHeight) {
            y = window.innerHeight - panel.clientHeight;
        }

        overlay.position(x, y);
    });

    // update value of picker
    editor.method('picker:curve:set', function (value, args) {
        if (!changing) {
            setValue(value, args || {});
        }
    });
});
