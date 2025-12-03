import { Events } from '@playcanvas/observer';

import { LegacyButton } from '@/common/ui/button';
import { LegacyCanvas } from '@/common/ui/canvas';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyNumberField } from '@/common/ui/number-field';
import { LegacyOverlay } from '@/common/ui/overlay';
import { LegacyPanel } from '@/common/ui/panel';
import { LegacySelectField } from '@/common/ui/select-field';
import { LegacyTextField } from '@/common/ui/text-field';
import { LegacyTooltip } from '@/common/ui/tooltip';
import { assignEvents } from '@/common/utils';
import { hexStr, hsv2rgb, normalizedCoord, rgb2hsv, rgbaStr, toHsva, toRgba } from '@/core/color';
import { CURVE_LINEAR, CURVE_SPLINE, CURVE_STEP } from '@/core/constants';

class ColorPicker extends Events {
    panel: any;

    colorRect: any;

    colorHandle: any;

    hueRect: any;

    hueHandle: any;

    alphaRect: any;

    alphaHandle: any;

    fields: any;

    fieldChangeHandler: any;

    hexChangeHandler: any;

    downHandler: any;

    moveHandler: any;

    upHandler: any;

    rField: any;

    gField: any;

    bField: any;

    aField: any;

    hexField: any;

    _hsva: number[] = [-1, -1, -1, 1];

    _storeHsva: number[] = [0, 0, 0, 1];

    _dragMode: number = 0;

    _changing: boolean = false;

    constructor(parent) {
        super();
        assignEvents(this);

        // capture this for the event handler
        function genEvtHandler(self, func) {
            return function (evt) {
                func.apply(self, [evt]);
            };
        }

        this.panel = new LegacyPanel();
        this.panel.class.add('color-panel');
        parent.appendChild(this.panel.element);

        this.colorRect = new LegacyCanvas({ useDevicePixelRatio: true });
        this.colorRect.class.add('color-rect');
        this.panel.append(this.colorRect.element);
        this.colorRect.resize(this.colorRect.element.clientWidth,
            this.colorRect.element.clientHeight);

        this.colorHandle = document.createElement('div');
        this.colorHandle.classList.add('color-handle');
        this.panel.append(this.colorHandle);

        this.hueRect = new LegacyCanvas({ useDevicePixelRatio: true });
        this.hueRect.class.add('hue-rect');
        this.panel.append(this.hueRect.element);
        this.hueRect.resize(this.hueRect.element.clientWidth,
            this.hueRect.element.clientHeight);

        this.hueHandle = document.createElement('div');
        this.hueHandle.classList.add('hue-handle');
        this.panel.append(this.hueHandle);

        this.alphaRect = new LegacyCanvas({ useDevicePixelRatio: true });
        this.alphaRect.class.add('alpha-rect');
        this.panel.append(this.alphaRect.element);
        this.alphaRect.resize(this.alphaRect.element.clientWidth,
            this.alphaRect.element.clientHeight);

        this.alphaHandle = document.createElement('div');
        this.alphaHandle.classList.add('alpha-handle');
        this.panel.append(this.alphaHandle);

        this.fields = document.createElement('div');
        this.fields.classList.add('fields');
        this.panel.append(this.fields);

        this.fieldChangeHandler = genEvtHandler(this, this._onFieldChanged);
        this.hexChangeHandler = genEvtHandler(this, this._onHexChanged);
        this.downHandler = genEvtHandler(this, this._onMouseDown);
        this.moveHandler = genEvtHandler(this, this._onMouseMove);
        this.upHandler = genEvtHandler(this, this._onMouseUp);

        function numberField(label) {
            const field = new LegacyNumberField({
                precision: 1,
                step: 1,
                min: 0,
                max: 255
            });
            field.renderChanges = false;
            field.placeholder = label;
            field.on('change', this.fieldChangeHandler);
            this.fields.appendChild(field.element);
            return field;
        }

        this.rField = numberField.call(this, 'r');
        this.gField = numberField.call(this, 'g');
        this.bField = numberField.call(this, 'b');
        this.aField = numberField.call(this, 'a');

        this.hexField = new LegacyTextField({});
        this.hexField.renderChanges = false;
        this.hexField.placeholder = '#';
        this.hexField.on('change', this.hexChangeHandler);
        this.fields.appendChild(this.hexField.element);

        // hook up mouse handlers
        this.colorRect.element.addEventListener('mousedown', this.downHandler);
        this.hueRect.element.addEventListener('mousedown', this.downHandler);
        this.alphaRect.element.addEventListener('mousedown', this.downHandler);

        this._generateHue(this.hueRect);
        this._generateAlpha(this.alphaRect);
    }

    _generateHue(canvas) {
        const ctx = canvas.element.getContext('2d');
        const w = canvas.pixelWidth;
        const h = canvas.pixelHeight;
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        for (let t = 0; t <= 6; t += 1) {
            gradient.addColorStop(t / 6, rgbaStr(hsv2rgb([t / 6, 1, 1])));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    _generateAlpha(canvas) {
        const ctx = canvas.element.getContext('2d');
        const w = canvas.pixelWidth;
        const h = canvas.pixelHeight;
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgb(255, 255, 255)');
        gradient.addColorStop(1, 'rgb(0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    _generateGradient(canvas, clr) {
        const ctx = canvas.element.getContext('2d');
        const w = canvas.pixelWidth;
        const h = canvas.pixelHeight;

        let gradient = ctx.createLinearGradient(0, 0, w, 0);
        gradient.addColorStop(0, rgbaStr([255, 255, 255, 255]));
        gradient.addColorStop(1, rgbaStr([clr[0], clr[1], clr[2], 255]));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 255)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }

    _onFieldChanged() {
        if (!this._changing) {
            const rgba = [
                this.rField.value,
                this.gField.value,
                this.bField.value,
                this.aField.value
            ].map((v) => {
                return v / 255;
            });
            this.hsva = toHsva(rgba);
            this.emit('change', this.color);
        }
    }

    _onHexChanged() {
        if (!this._changing) {
            const hex = this.hexField.value.trim().toLowerCase();
            if (/^(?:[0-9a-f]{2}){3,4}$/.test(hex)) {
                const rgb = [parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)];
                this.hsva = rgb2hsv(rgb).concat([this.hsva[3]]);
                this.emit('change', this.color);
            }
        }
    }

    _onMouseDown(evt) {
        if (evt.currentTarget === this.colorRect.element) {
            this._dragMode = 1;     // drag color
        } else if (evt.currentTarget === this.hueRect.element) {
            this._dragMode = 2;     // drag hue
        } else {
            this._dragMode = 3;     // drag alpha
        }

        this._storeHsva = this._hsva.slice();
        this._onMouseMove(evt);

        // hook up mouse
        window.addEventListener('mousemove', this.moveHandler);
        window.addEventListener('mouseup', this.upHandler);
    }

    _onMouseMove(evt) {
        let newhsva;
        if (this._dragMode === 1) {
            const m = normalizedCoord(this.colorRect, evt.pageX, evt.pageY);
            const s = pc.math.clamp(m[0], 0, 1);
            const v = pc.math.clamp(m[1], 0, 1);
            newhsva = [this.hsva[0], s, 1 - v, this._hsva[3]];
        } else if (this._dragMode === 2) {
            const m = normalizedCoord(this.hueRect, evt.pageX, evt.pageY);
            const h = pc.math.clamp(m[1], 0, 1);
            newhsva = [h, this.hsva[1], this.hsva[2], this.hsva[3]];
        } else {
            const m = normalizedCoord(this.alphaRect, evt.pageX, evt.pageY);
            const a = pc.math.clamp(m[1], 0, 1);
            newhsva = [this.hsva[0], this.hsva[1], this.hsva[2], 1 - a];
        }
        if (newhsva[0] !== this._hsva[0] ||
            newhsva[1] !== this._hsva[1] ||
            newhsva[2] !== this._hsva[2] ||
            newhsva[3] !== this._hsva[3]) {
            this.hsva = newhsva;
            this.emit('changing', this.color);
        }
    }

    _onMouseUp(evt) {
        window.removeEventListener('mousemove', this.moveHandler);
        window.removeEventListener('mouseup', this.upHandler);

        if (this._storeHsva[0] !== this._hsva[0] ||
            this._storeHsva[1] !== this._hsva[1] ||
            this._storeHsva[2] !== this._hsva[2] ||
            this._storeHsva[3] !== this._hsva[3]) {
            this.emit('change', this.color);
        }
    }

    set hsva(hsva) {
        const rgb = hsv2rgb(hsva);
        const hueRgb = hsv2rgb([hsva[0], 1, 1]);

        // regenerate gradient canvas if hue changes
        if (hsva[0] !== this._hsva[0]) {
            this._generateGradient(this.colorRect, hueRgb);
        }

        const e = this.colorRect.element;
        const r = e.getBoundingClientRect();
        const w = r.width - 2;
        const h = r.height - 2;

        this.colorHandle.style.backgroundColor = rgbaStr(rgb);
        this.colorHandle.style.left = `${e.offsetLeft - 7 + Math.floor(w * hsva[1])}px`;
        this.colorHandle.style.top = `${e.offsetTop - 7 + Math.floor(h * (1 - hsva[2]))}px`;

        this.hueHandle.style.backgroundColor = rgbaStr(hueRgb);
        this.hueHandle.style.top = `${e.offsetTop - 3 + Math.floor(140 * hsva[0])}px`;
        this.hueHandle.style.left = '162px';

        this.alphaHandle.style.backgroundColor = rgbaStr(hsv2rgb([0, 0, hsva[3]]));
        this.alphaHandle.style.top = `${e.offsetTop - 3 + Math.floor(140 * (1 - hsva[3]))}px`;
        this.alphaHandle.style.left = '194px';

        this._changing = true;
        this.rField.value = rgb[0];
        this.gField.value = rgb[1];
        this.bField.value = rgb[2];
        this.aField.value = Math.round(hsva[3] * 255);
        this.hexField.value = hexStr(rgb);
        this._changing = false;

        this._hsva = hsva;
    }

    get hsva() {
        return this._hsva;
    }

    set color(clr) {
        const hsva = toHsva(clr);
        if (hsva[0] === 0 && hsva[1] === 0 && this._hsva[0] !== -1) {
            // if the incoming RGB is a shade of grey (without hue),
            // use the current active hue instead.
            hsva[0] = this._hsva[0];
        }
        this.hsva = hsva;
    }

    get color() {
        return toRgba(this._hsva);
    }

    set editAlpha(editAlpha) {
        if (editAlpha) {
            this.alphaRect.element.style.display = 'inline';
            this.alphaHandle.style.display = 'block';
            this.aField.element.style.display = 'inline-block';
        } else {
            this.alphaRect.element.style.display = 'none';
            this.alphaHandle.style.display = 'none';
            this.aField.element.style.display = 'none';
        }
    }
}

// gradient picker

editor.once('load', () => {
    // constants
    const CONST = {
        bg: '#2c393c',
        anchorRadius: 5,
        selectedRadius: 7
    };

    // ui widgets
    const UI = {
        root: editor.call('layout.root'),
        overlay: new LegacyOverlay(),
        panel: document.createElement('div'),
        gradient: new LegacyCanvas({ useDevicePixelRatio: true }),
        checkerPattern: createCheckerPattern(),
        anchors: new LegacyCanvas({ useDevicePixelRatio: true }),
        footer: new LegacyPanel(),
        typeLabel: new LegacyLabel({ text: 'Type' }),
        typeCombo: new LegacySelectField({
            options: { 0: 'placeholder' },
            type: 'number'
        }),
        positionLabel: new LegacyLabel({ text: 'Position' }),
        positionEdit: new LegacyNumberField({ min: 0, max: 100, step: 1 }),
        resetButton: new LegacyButton({ text: '&#57680' }),
        copyButton: new LegacyButton({ text: '&#58193' }),
        pasteButton: new LegacyButton({ text: '&#58184' }),
        colorPicker: null
    };

    // current state
    const STATE = {
        curves: [],            // holds all the gradient curves (either 3 or 4 of them)
        keystore: [],          // holds the curve during edit
        anchors: [],           // holds the times of the anchors
        hoveredAnchor: -1,     // index of the hovered anchor
        selectedAnchor: -1,    // index of selected anchor
        selectedValue: [],     // value being dragged
        changing: false,       // UI is currently changing
        draggingAnchor: false,
        typeMap: { }          // map from curve type dropdown to engine curve enum
    };

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
    }

    // handle the picker being closed
    function onClose() {
        STATE.hoveredAnchor = -1;
        window.removeEventListener('mousemove', anchorsOnMouseMove);
        window.removeEventListener('mouseup', anchorsOnMouseUp);
        UI.anchors.element.removeEventListener('mousedown', anchorsOnMouseDown);
        editor.emit('picker:gradient:close');
        editor.emit('picker:close', 'gradient');
    }

    function onDeleteKey() {
        if (!UI.overlay.hidden) {
            if (STATE.selectedAnchor !== -1) {
                const deleteTime = STATE.anchors[STATE.selectedAnchor];
                STATE.selectedAnchor = -1;
                deleteAnchor(deleteTime);
            }
        }
    }

    function onTypeChanged(value) {
        value = STATE.typeMap[value];
        const paths = [];
        const values = [];
        for (let i = 0; i < STATE.curves.length; ++i) {
            paths.push(`${i.toString()}.type`);
            values.push(value);
        }
        editor.emit('picker:curve:change', paths, values);
    }

    function render() {
        renderGradient();
        renderAnchors();
    }

    function renderGradient() {
        const ctx = UI.gradient.element.getContext('2d');
        const w = UI.gradient.width;
        const h = UI.gradient.height;
        const r = UI.gradient.pixelRatio;

        ctx.setTransform(r, 0, 0, r, 0, 0);

        // fill background
        ctx.fillStyle = UI.checkerPattern;
        ctx.fillRect(0, 0, w, h);

        // fill gradient
        const gradient = ctx.createLinearGradient(0, 0, w, 0);
        for (let t = 0; t <= w; t += 2) {
            const x = t / w;
            gradient.addColorStop(x, rgbaStr(evaluateGradient(x), 255));
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // render the tip of the selected anchor
        if (STATE.selectedAnchor !== -1) {
            const time = STATE.anchors[STATE.selectedAnchor];
            const coords = [time * w, h];

            ctx.beginPath();
            ctx.rect(coords[0] - 2,
                coords[1],
                4,
                -6);
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fill();

            ctx.beginPath();
            ctx.rect(coords[0] - 1,
                coords[1],
                2,
                -6);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fill();
        }
    }

    function renderAnchors() {
        const ctx = UI.anchors.element.getContext('2d');
        const w = UI.anchors.width;
        const h = UI.anchors.height;
        const r = UI.anchors.pixelRatio;

        ctx.setTransform(r, 0, 0, r, 0, 0);

        ctx.fillStyle = CONST.bg;
        ctx.fillRect(0, 0, w, h);

        // render plain anchors
        for (let index = 0; index < STATE.anchors.length; ++index) {

            if (index !== STATE.hoveredAnchor &&
                index !== STATE.selectedAnchor) {
                renderAnchor(ctx, STATE.anchors[index]);
            }
        }

        if ((STATE.hoveredAnchor !== -1) &&
            (STATE.hoveredAnchor !== STATE.selectedAnchor)) {
            renderAnchor(ctx, STATE.anchors[STATE.hoveredAnchor], 'hovered');
        }

        if (STATE.selectedAnchor !== -1) {
            renderAnchor(ctx, STATE.anchors[STATE.selectedAnchor], 'selected');
        }
    }

    function renderAnchor(ctx, time, type) {
        const coords = [time * UI.anchors.width, UI.anchors.height / 2];
        const radius = (type === 'selected' ? CONST.selectedRadius : CONST.anchorRadius);

        // render selected arrow
        if (type === 'selected') {
            ctx.beginPath();
            ctx.rect(coords[0] - 2,
                coords[1],
                4,
                -coords[1]);
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fill();

            ctx.beginPath();
            ctx.rect(coords[0] - 1,
                coords[1],
                2,
                -coords[1]);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            ctx.fill();
        }

        // render selection highlight
        if (type === 'selected' || type === 'hovered') {
            ctx.beginPath();
            ctx.arc(coords[0], coords[1], (radius + 2), 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fill();
        }

        // render the color circle and border
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], (radius + 1), 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(coords[0], coords[1], (radius), 0, 2 * Math.PI, false);
        ctx.fillStyle = rgbaStr(evaluateGradient(time, 1), 255);
        ctx.fill();
    }

    function evaluateGradient(time, alphaOverride) {
        const result = [];
        for (let i = 0; i < 3; ++i) {
            result.push(STATE.curves[i].value(time));
        }

        if (alphaOverride) {
            result.push(alphaOverride);
        } else if (STATE.curves.length > 3) {
            result.push(STATE.curves[3].value(time));
        } else {
            result.push(1);
        }

        return result;
    }

    function calcAnchorTimes() {
        // get curve anchor points
        let times = [];
        for (let i = 0; i < STATE.curves.length; i++) {
            const curve = STATE.curves[i];
            for (let j = 0; j < curve.keys.length; ++j) {
                times.push(curve.keys[j][0]);
            }
        }

        // sort anchors and remove duplicates
        times.sort();
        times = times.filter((item, pos, ary) => {
            return !pos || item !== ary[pos - 1];
        });

        return times;
    }

    // helper function for calculating the normalized coordinate
    // x,y relative to rect
    function calcNormalizedCoord(x, y, rect) {
        return [(x - rect.left) / rect.width,
            (y - rect.top) / rect.height];
    }

    // get the bounding client rect minus padding
    function getClientRect(element) {
        const styles = window.getComputedStyle(element);

        const paddingTop = parseFloat(styles.paddingTop);
        const paddingRight = parseFloat(styles.paddingRight);
        const paddingBottom = parseFloat(styles.paddingBottom);
        const paddingLeft = parseFloat(styles.paddingLeft);

        const rect = element.getBoundingClientRect();

        return new DOMRect(rect.x + paddingLeft,
            rect.y + paddingTop,
            rect.width - paddingRight - paddingLeft,
            rect.height - paddingTop - paddingBottom);
    }

    function anchorsOnMouseDown(e) {
        if (STATE.hoveredAnchor === -1) {
            // user clicked in empty space, create new anchor and select it
            const coord = calcNormalizedCoord(e.clientX,
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
    }

    function anchorsOnMouseMove(e) {
        const coord = calcNormalizedCoord(e.clientX,
            e.clientY,
            getClientRect(UI.anchors.element));

        if (UI.draggingAnchor) {
            dragUpdate(pc.math.clamp(coord[0], 0, 1));
        } else if (coord[0] >= 0 &&
                   coord[0] <= 1 &&
                   coord[1] >= 0 &&
                   coord[1] <= 1) {
            let closest = -1;
            let closestDist = 0;
            for (let index = 0; index < STATE.anchors.length; ++index) {
                const dist = Math.abs(STATE.anchors[index] - coord[0]);
                if (closest === -1 || dist < closestDist) {
                    closest = index;
                    closestDist = dist;
                }
            }

            const hoveredAnchor = (closest !== -1 && closestDist < 0.02) ? closest : -1;
            if (hoveredAnchor !== STATE.hoveredAnchor) {
                selectHovered(hoveredAnchor);
                render();
            }
        } else if (STATE.hoveredAnchor !== -1) {
            selectHovered(-1);
            render();
        }
    }

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
            UI.positionEdit.value = '';
            UI.colorPicker.color = [0, 0, 0];
        } else {
            const time = STATE.anchors[index];
            UI.positionEdit.value = Math.round(time * 100);
            STATE.selectedValue = evaluateGradient(time);
            UI.colorPicker.color = STATE.selectedValue;
        }
        STATE.changing = false;
        render();
    }

    function dragStart() {
        if (STATE.selectedAnchor === -1) {
            return;
        }
        const time = STATE.anchors[STATE.selectedAnchor];
        // make a copy of the curve data before editing starts
        STATE.keystore = [];
        for (let i = 0; i < STATE.curves.length; ++i) {
            const keys = [];
            STATE.curves[i].keys.forEach((element) => {
                if (element[0] !== time) {
                    keys.push([element[0], element[1]]);
                }
            });
            STATE.keystore.push(keys);
        }
    }

    function dragUpdate(time) {
        if (STATE.selectedAnchor === -1) {
            return;
        }
        for (let i = 0; i < STATE.curves.length; ++i) {
            const curve = STATE.curves[i];
            const keystore = STATE.keystore[i];

            // merge keystore with the drag anchor (ignoring existing anchors at
            // the current anchor location)
            curve.keys = keystore.map((element) => {
                return [element[0], element[1]];
            })
            .filter((element) => {
                return element[0] !== time;
            });
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
        for (let i = 0; i < STATE.curves.length; ++i) {
            const keys = STATE.curves[i].keys;

            let j = 0;
            while (j < keys.length) {
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
        for (let i = 0; i < STATE.curves.length; ++i) {
            const curve = STATE.curves[i];

            for (let j = 0; j < curve.keys.length; ++j) {
                if (curve.keys[j][0] === time) {
                    curve.keys.splice(j, 1);
                    break;
                }
            }
        }
        selectHovered(-1);
        emitCurveChange();
    }

    function moveSelectedAnchor(time) {
        if (STATE.selectedAnchor !== -1) {
            dragStart();
            dragUpdate(time);
            dragEnd();
        }
    }

    function colorSelectedAnchor(clr, dragging) {
        if (STATE.selectedAnchor !== -1) {
            const time = STATE.anchors[STATE.selectedAnchor];

            for (let i = 0; i < STATE.curves.length; ++i) {
                const curve = STATE.curves[i];

                for (let j = 0; j < curve.keys.length; ++j) {
                    if (curve.keys[j][0] === time) {
                        curve.keys[j][1] = clr[i];
                        break;
                    }
                }
            }
            STATE.selectedValue = clr;
            if (dragging) {
                render();
            } else {
                emitCurveChange();
            }
        }
    }

    function emitCurveChange() {
        const paths = [];
        const values = [];
        STATE.curves.forEach((curve, index) => {
            paths.push(`0.keys.${index}`);
            const keys = [];
            curve.keys.forEach((key) => {
                keys.push(key[0], key[1]);
            });
            values.push(keys);
        });
        editor.emit('picker:curve:change', paths, values);
    }

    function doReset() {
        // Remove all the anchors in the gradient
        for (let i = 0; i < STATE.curves.length; ++i) {
            STATE.curves[i].keys = [];
        }

        // Add a default key
        insertAnchor(0, [1, 1, 1]);

        selectHovered(-1);
        emitCurveChange();
    }

    function doCopy() {
        const data = {
            type: STATE.curves[0].type,
            keys: STATE.curves.map((c) => {
                // eslint-disable-next-line prefer-spread
                return [].concat.apply([], c.keys);
            })
        };
        editor.call('localStorage:set', 'playcanvas_editor_clipboard_gradient', data);
    }

    function doPaste() {
        const data = editor.call('localStorage:get', 'playcanvas_editor_clipboard_gradient');
        if (data) {
            // only paste the number of curves we're currently editing
            const pasteData = {
                type: data.type,
                keys: []
            };

            for (let index = 0; index < STATE.curves.length; ++index) {
                if (index < data.keys.length) {
                    pasteData.keys.push(data.keys[index]);
                } else {
                    // eslint-disable-next-line prefer-spread
                    pasteData.keys.push([].concat.apply([], STATE.curves[index].keys));
                }
            }

            setValue([pasteData]);
            emitCurveChange();
        }
    }

    function createCheckerPattern() {
        const canvas = new LegacyCanvas();
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.element.getContext('2d');
        ctx.fillStyle = '#949a9c';
        ctx.fillRect(0, 0, 8, 8);
        ctx.fillRect(8, 8, 8, 8);
        ctx.fillStyle = '#657375';
        ctx.fillRect(8, 0, 8, 8);
        ctx.fillRect(0, 8, 8, 8);
        return ctx.createPattern(canvas.element, 'repeat');
    }

    function setValue(value, args) {
        // sanity checks mostly for script 'curve' attributes
        if (!(value instanceof Array) ||
            value.length !== 1 ||
            value[0].keys === undefined ||
            (value[0].keys.length !== 3 && value[0].keys.length !== 4)) {
            return;
        }

        // store the curve type
        const comboItems = {
            0: 'Step',
            1: 'Linear',
            2: 'Spline'
        };
        STATE.typeMap = {
            0: CURVE_STEP,
            1: CURVE_LINEAR,
            2: CURVE_SPLINE
        };
        // check if curve is using a legacy curve type
        if (value[0].type !== CURVE_STEP &&
            value[0].type !== CURVE_LINEAR &&
            value[0].type !== CURVE_SPLINE) {
            comboItems[3] = 'Legacy';
            STATE.typeMap[3] = value[0].type;
        }
        UI.typeCombo._updateOptions(comboItems);
        UI.typeCombo.value = { 0: 1, 1: 3, 2: 3, 3: 3, 4: 2, 5: 0 }[value[0].type];

        // store the curves
        STATE.curves = [];
        value[0].keys.forEach((keys) => {
            const curve = new pc.Curve(keys);
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

        UI.colorPicker.editAlpha = STATE.curves.length > 3;
    }

    // initialize overlay
    UI.root.append(UI.overlay);
    UI.overlay.class.add('picker-gradient');
    UI.overlay.center = false;
    UI.overlay.transparent = true;
    UI.overlay.hidden = true;

    UI.overlay.on('show', () => {
        onOpen();
    });

    UI.overlay.on('hide', () => {
        onClose();
    });

    // panel
    UI.panel.classList.add('picker-gradient-panel');
    UI.overlay.append(UI.panel);

    // gradient
    UI.panel.appendChild(UI.gradient.element);
    UI.gradient.class.add('picker-gradient-gradient');
    let r = getClientRect(UI.gradient.element);
    UI.gradient.resize(r.width, r.height);

    // anchors
    UI.panel.appendChild(UI.anchors.element);
    UI.anchors.class.add('picker-gradient-anchors');
    r = getClientRect(UI.anchors.element);
    UI.anchors.resize(r.width, r.height);

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
    UI.positionEdit.on('change', (value) => {
        if (!STATE.changing) {
            moveSelectedAnchor(value / 100);
        }
    });

    UI.resetButton.on('click', doReset);
    UI.footer.append(UI.resetButton);
    LegacyTooltip.attach({
        target: UI.resetButton.element,
        text: 'Reset',
        align: 'bottom',
        root: UI.root
    });

    UI.copyButton.on('click', doCopy);
    UI.footer.append(UI.copyButton);
    LegacyTooltip.attach({
        target: UI.copyButton.element,
        text: 'Copy',
        align: 'bottom',
        root: UI.root
    });

    UI.pasteButton.on('click', doPaste);
    UI.footer.append(UI.pasteButton);
    LegacyTooltip.attach({
        target: UI.pasteButton.element,
        text: 'Paste',
        align: 'bottom',
        root: UI.root
    });

    // construct the color picker
    UI.colorPicker = new ColorPicker(UI.panel);
    UI.colorPicker.on('change', colorSelectedAnchor);
    UI.colorPicker.on('changing', (color) => {
        colorSelectedAnchor(color, true);
    });

    // esc to close
    editor.call('hotkey:register', 'picker:gradient:close', {
        key: 'Escape',
        callback: close
    });

    editor.call('hotkey:register', 'gradient-anchor:delete', {
        key: 'Delete',
        callback: onDeleteKey
    });

    editor.call('hotkey:register', 'gradient-anchor:delete', {
        key: 'Backspace',
        ctrl: true,
        callback: onDeleteKey
    });

    // show the gradient picker
    editor.method('picker:gradient', (value, args) => {
        setValue(value, args);
        open();
    });

    editor.method('picker:gradient:set', (value, args) => {
        setValue(value, args);
    });

    editor.method('picker:gradient:rect', () => {
        return UI.overlay.rect;
    });

    editor.method('picker:gradient:position', (x, y) => {
        if (y + UI.panel.clientHeight > window.innerHeight) {
            y = window.innerHeight - UI.panel.clientHeight;
        }
        UI.overlay.position(x, y);
    });
});
