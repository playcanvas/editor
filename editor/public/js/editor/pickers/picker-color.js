editor.once('load', function() {
    'use strict';

    var overlay = new ui.Overlay();
    overlay.class.add('picker-color');
    overlay.hidden = true;


    // rectangular picker
    var pickRect = document.createElement('canvas');
    pickRect.classList.add('pick-rect');
    pickRect.width = 128;
    pickRect.height = 128;
    overlay.append(pickRect);


    // hue (rainbow) picker
    var pickHue = document.createElement('canvas');
    pickHue.classList.add('pick-hue');
    pickHue.width = 8;
    pickHue.height = 128;
    overlay.append(pickHue);


    // hue (rainbow) picker
    var pickOpacity = document.createElement('canvas');
    pickOpacity.classList.add('pick-opacity');
    pickOpacity.width = 8;
    pickOpacity.height = 128;
    overlay.append(pickOpacity);


    // fields
    var panelFields = document.createElement('div');
    panelFields.classList.add('fields');
    overlay.append(panelFields);


    // R
    var fieldR = new ui.NumberField();
    fieldR.placeholder = 'r';
    fieldR.flexGrow = 1;
    fieldR.class.add('field');
    panelFields.appendChild(fieldR.element);

    // G
    var fieldG = new ui.NumberField();
    fieldG.placeholder = 'g';
    fieldG.flexGrow = 1;
    fieldG.class.add('field');
    panelFields.appendChild(fieldG.element);

    // B
    var fieldB = new ui.NumberField();
    fieldB.placeholder = 'b';
    fieldB.flexGrow = 1;
    fieldB.class.add('field');
    panelFields.appendChild(fieldB.element);

    // A
    var fieldA = new ui.NumberField();
    fieldA.placeholder = 'a';
    fieldA.flexGrow = 1;
    fieldA.class.add('field');
    panelFields.appendChild(fieldA.element);

    // HEX
    var fieldHex = new ui.TextField();
    fieldHex.placeholder = '#';
    fieldHex.flexGrow = 1;
    fieldHex.class.add('field');
    panelFields.appendChild(fieldHex.element);


    var root = editor.call('layout.root');
    root.append(overlay);


    // call picker
    editor.method('picker:color', function(fn) {
        overlay.hidden = false;
    });
});
