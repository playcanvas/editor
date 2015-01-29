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
    var panelFields = new ui.Panel();
    panelFields.class.add('fields');
    overlay.append(panelFields);


    // R
    var fieldR = new ui.NumberField();
    fieldR.class.add('field-r');
    panelFields.append(fieldR);

    // G
    var fieldG = new ui.NumberField();
    fieldG.class.add('field-g');
    panelFields.append(fieldG);

    // B
    var fieldB = new ui.NumberField();
    fieldB.class.add('field-b');
    panelFields.append(fieldB);

    // A
    var fieldA = new ui.NumberField();
    fieldA.class.add('field-a');
    panelFields.append(fieldA);

    // HEX
    var fieldHex = new ui.TextField();
    fieldHex.class.add('field-hex');
    panelFields.append(fieldHex);


    var root = editor.call('layout.root');
    root.append(overlay);


    // call picker
    editor.method('picker:color', function(fn) {
        overlay.hidden = false;
    });
});
