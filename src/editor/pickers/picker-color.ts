import { LegacyNumberField } from '@/common/ui/number-field';
import { LegacyOverlay } from '@/common/ui/overlay';
import { LegacyTextField } from '@/common/ui/text-field';
import { hsv2rgb, rgb2hsv } from '@/core/color';

editor.once('load', () => {
    const size = 144;
    let directInput = true;
    const colorHSV = [0, 0, 0];
    const channels = [];
    let channelsNumber = 4;
    let changing = false;
    let dragging = false;


    // make hex out of channels
    const getHex = function () {
        let hex = '';
        for (let i = 0; i < channelsNumber; i++) {
            hex += (`00${channels[i].value.toString(16)}`).slice(-2).toUpperCase();
        }
        return hex;
    };

    // rect drag
    const pickRectMouseMove = function (evt: MouseEvent) {
        changing = true;
        const rect = pickRect.getBoundingClientRect();
        const x = Math.max(0, Math.min(size, Math.floor(evt.clientX - rect.left)));
        const y = Math.max(0, Math.min(size, Math.floor(evt.clientY - rect.top)));

        colorHSV[1] = x / size;
        colorHSV[2] = 1.0 - (y / size);

        directInput = false;
        const rgb = hsv2rgb([colorHSV[0], colorHSV[1], colorHSV[2]]);
        for (let i = 0; i < 3; i++) {
            channels[i].value = rgb[i];
        }
        fieldHex.value = getHex();
        directInput = true;

        pickRectHandle.style.left = `${Math.max(4, Math.min(size - 4, x))}px`;
        pickRectHandle.style.top = `${Math.max(4, Math.min(size - 4, y))}px`;
        changing = false;
    };

    // rect drag stop
    const pickRectMouseUp = function () {
        window.removeEventListener('mousemove', pickRectMouseMove, false);
        window.removeEventListener('mouseup', pickRectMouseUp, false);
        dragging = false;
        editor.emit('picker:color:end');
    };

    // hue drag
    const pickHueMouseMove = function (evt: MouseEvent) {
        changing = true;
        const rect = pickHue.getBoundingClientRect();
        const y = Math.max(0, Math.min(size, Math.floor(evt.clientY - rect.top)));
        const h = y / size;

        const rgb = hsv2rgb([h, colorHSV[1], colorHSV[2]]);
        colorHSV[0] = h;

        directInput = false;
        for (let i = 0; i < 3; i++) {
            channels[i].value = rgb[i];
        }
        fieldHex.value = getHex();
        updateRects();
        directInput = true;
        changing = false;
    };

    // hue drag stop
    const pickHueMouseUp = function () {
        window.removeEventListener('mousemove', pickHueMouseMove, false);
        window.removeEventListener('mouseup', pickHueMouseUp, false);
        dragging = false;
        editor.emit('picker:color:end');
    };

    // opacity drag
    const pickOpacityMouseMove = function (evt: MouseEvent) {
        changing = true;
        const rect = pickHue.getBoundingClientRect();
        const y = Math.max(0, Math.min(size, Math.floor(evt.clientY - rect.top)));
        const o = 1.0 - y / size;

        directInput = false;
        fieldA.value = Math.max(0, Math.min(255, Math.round(o * 255)));
        fieldHex.value = getHex();
        directInput = true;
        changing = false;
    };

    // opacity drag stop
    const pickOpacityMouseUp = function () {
        window.removeEventListener('mousemove', pickOpacityMouseMove, false);
        window.removeEventListener('mouseup', pickOpacityMouseUp, false);
        dragging = false;
        editor.emit('picker:color:end');
    };


    const updateHex = function () {
        if (!directInput) {
            return;
        }

        changing = true;

        const hex = fieldHex.value.trim().toLowerCase();
        if (/^(?:[0-9a-f]{2}){3,4}$/.test(hex)) {
            for (let i = 0; i < channelsNumber; i++) {
                channels[i].value = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
            }
        }

        changing = false;
    };


    // update rgb
    var updateRects = function () {
        const color = channels.map((channel) => {
            return channel.value || 0;
        }).slice(0, channelsNumber);

        const hsv = rgb2hsv(color);
        if (directInput) {
            const sum = color[0] + color[1] + color[2];
            if (sum !== 765 && sum !== 0) {
                colorHSV[0] = hsv[0];
            }

            colorHSV[1] = hsv[1];
            colorHSV[2] = hsv[2];

            dragging = true;
            editor.emit('picker:color:start');
        }

        // hue position
        pickHueHandle.style.top = `${Math.floor(size * colorHSV[0])}px`; // h

        // rect position
        pickRectHandle.style.left = `${Math.max(4, Math.min(size - 4, size * colorHSV[1]))}px`; // s
        pickRectHandle.style.top = `${Math.max(4, Math.min(size - 4, size * (1.0 - colorHSV[2])))}px`; // v

        if (channelsNumber >= 3) {
            const plainColor = hsv2rgb([colorHSV[0], 1, 1]).join(',');

            // rect background color
            pickRect.style.backgroundColor = `rgb(${plainColor})`;

            // rect handle color
            pickRectHandle.style.backgroundColor = `rgb(${color.slice(0, 3).join(',')})`;

            // hue handle color
            pickHueHandle.style.backgroundColor = `rgb(${plainColor})`;
        }

        callCallback();
    };

    // update alpha handle
    const updateRectAlpha = function (value: number) {
        if (channelsNumber !== 4) {
            return;
        }

        // position
        pickOpacityHandle.style.top = `${Math.floor(size * (1.0 - (Math.max(0, Math.min(255, value)) / 255)))}px`;

        // color
        pickOpacityHandle.style.backgroundColor = `rgb(${[value, value, value].join(',')})`;

        callCallback();
    };


    let callingCallback = false;
    const callbackHandle = function () {
        callingCallback = false;

        editor.emit('picker:color', channels.map((channel) => {
            return channel.value || 0;
        }).slice(0, channelsNumber));
    };
    var callCallback = function () {
        if (callingCallback) {
            return;
        }

        callingCallback = true;
        setTimeout(callbackHandle, 1000 / 60);
    };


    // overlay
    const overlay = new LegacyOverlay();
    overlay.class.add('picker-color');
    overlay.center = false;
    overlay.transparent = true;
    overlay.hidden = true;


    // rectangular picker
    var pickRect = document.createElement('div');
    pickRect.classList.add('pick-rect');
    overlay.append(pickRect);

    // rect drag start
    pickRect.addEventListener('mousedown', (evt) => {
        pickRectMouseMove(evt);

        window.addEventListener('mousemove', pickRectMouseMove, false);
        window.addEventListener('mouseup', pickRectMouseUp, false);

        evt.stopPropagation();
        evt.preventDefault();
        dragging = true;
        editor.emit('picker:color:start');
    });

    // white
    const pickRectWhite = document.createElement('div');
    pickRectWhite.classList.add('white');
    pickRect.appendChild(pickRectWhite);

    // black
    const pickRectBlack = document.createElement('div');
    pickRectBlack.classList.add('black');
    pickRect.appendChild(pickRectBlack);

    // handle
    var pickRectHandle = document.createElement('div');
    pickRectHandle.classList.add('handle');
    pickRect.appendChild(pickRectHandle);


    // hue (rainbow) picker
    var pickHue = document.createElement('div');
    pickHue.classList.add('pick-hue');
    overlay.append(pickHue);

    // hue drag start
    pickHue.addEventListener('mousedown', (evt) => {
        pickHueMouseMove(evt);

        window.addEventListener('mousemove', pickHueMouseMove, false);
        window.addEventListener('mouseup', pickHueMouseUp, false);

        evt.stopPropagation();
        evt.preventDefault();
        dragging = true;
        editor.emit('picker:color:start');
    });

    // handle
    var pickHueHandle = document.createElement('div');
    pickHueHandle.classList.add('handle');
    pickHue.appendChild(pickHueHandle);


    // opacity (gradient) picker
    const pickOpacity = document.createElement('div');
    pickOpacity.classList.add('pick-opacity');
    overlay.append(pickOpacity);

    // opacity drag start
    pickOpacity.addEventListener('mousedown', (evt) => {
        pickOpacityMouseMove(evt);

        window.addEventListener('mousemove', pickOpacityMouseMove, false);
        window.addEventListener('mouseup', pickOpacityMouseUp, false);

        evt.stopPropagation();
        evt.preventDefault();
        dragging = true;
        editor.emit('picker:color:start');
    });

    // handle
    var pickOpacityHandle = document.createElement('div');
    pickOpacityHandle.classList.add('handle');
    pickOpacity.appendChild(pickOpacityHandle);


    // fields
    const panelFields = document.createElement('div');
    panelFields.classList.add('fields');
    overlay.append(panelFields);


    // R
    const fieldR = new LegacyNumberField({
        precision: 1,
        step: 1,
        min: 0,
        max: 255
    });
    channels.push(fieldR);
    fieldR.renderChanges = false;
    fieldR.placeholder = 'r';
    fieldR.flexGrow = 1;
    fieldR.class.add('field', 'field-r');
    fieldR.on('change', updateRects);
    panelFields.appendChild(fieldR.element);

    // G
    const fieldG = new LegacyNumberField({
        precision: 1,
        step: 1,
        min: 0,
        max: 255
    });
    channels.push(fieldG);
    fieldG.renderChanges = false;
    fieldG.placeholder = 'g';
    fieldG.class.add('field', 'field-g');
    fieldG.on('change', updateRects);
    panelFields.appendChild(fieldG.element);

    // B
    const fieldB = new LegacyNumberField({
        precision: 1,
        step: 1,
        min: 0,
        max: 255
    });
    channels.push(fieldB);
    fieldB.renderChanges = false;
    fieldB.placeholder = 'b';
    fieldB.class.add('field', 'field-b');
    fieldB.on('change', updateRects);
    panelFields.appendChild(fieldB.element);


    // A
    var fieldA = new LegacyNumberField({
        precision: 1,
        step: 1,
        min: 0,
        max: 255
    });
    channels.push(fieldA);
    fieldA.renderChanges = false;
    fieldA.placeholder = 'a';
    fieldA.class.add('field', 'field-a');
    fieldA.on('change', updateRectAlpha);
    panelFields.appendChild(fieldA.element);


    // HEX
    var fieldHex = new LegacyTextField();
    fieldHex.renderChanges = false;
    fieldHex.placeholder = '#';
    fieldHex.class.add('field', 'field-hex');
    fieldHex.on('change', () => {
        updateHex();
    });
    panelFields.appendChild(fieldHex.element);


    const root = editor.call('layout.root');
    root.append(overlay);


    // esc to close
    editor.call('hotkey:register', 'picker:color:close', {
        key: 'Escape',
        callback: function () {
            if (overlay.hidden) {
                return;
            }

            overlay.hidden = true;
        }
    });


    overlay.on('hide', () => {
        editor.emit('picker:color:close');
    });


    // call picker
    editor.method('picker:color', (color) => {
        // class for channels
        for (let i = 0; i < 4; i++) {
            if (color.length - 1 < i) {
                overlay.class.remove(`c-${i + 1}`);
            } else {
                overlay.class.add(`c-${i + 1}`);
            }
        }

        // number of channels
        channelsNumber = color.length;

        if (channelsNumber >= 3) {
            const hsv = rgb2hsv(color);
            colorHSV[0] = hsv[0];
            colorHSV[1] = hsv[1];
            colorHSV[2] = hsv[2];
        }

        // set fields
        directInput = false;
        for (let i = 0; i < color.length; i++) {
            channels[i].value = color[i];
        }
        fieldHex.value = getHex();
        directInput = true;

        // show overlay
        overlay.hidden = false;

        // focus on hex field
        fieldHex.elementInput.focus();

        setTimeout(() => {
            fieldHex.elementInput.focus();
            fieldHex.elementInput.select();
        }, 100);
    });

    editor.method('picker:color:close', () => {
        overlay.hidden = true;
    });

    editor.method('picker:color:rect', () => {
        return overlay.rect;
    });

    // position color picker
    editor.method('picker:color:position', (x, y) => {
        overlay.position(x, y);
    });

    // position color picker
    editor.method('picker:color:set', (color) => {
        if (changing || dragging) {
            return;
        }

        if (channelsNumber >= 3) {
            const hsv = rgb2hsv(color);
            colorHSV[0] = hsv[0];
            colorHSV[1] = hsv[1];
            colorHSV[2] = hsv[2];
        }

        // set fields
        directInput = false;
        for (let i = 0; i < color.length; i++) {
            channels[i].value = color[i];
        }
        fieldHex.value = getHex();
        directInput = true;
    });
});
