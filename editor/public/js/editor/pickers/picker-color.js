editor.once('load', function() {
    'use strict';

    var overlay = new ui.Overlay();
    overlay.class.add('picker-color');
    // overlay.hidden = true;


    // rectangular picker
    var pickRect = document.createElement('div');
    pickRect.classList.add('pick-rect');
    overlay.append(pickRect);

    // white
    var pickRectWhite = document.createElement('div');
    pickRectWhite.classList.add('white');
    pickRect.appendChild(pickRectWhite);

    // black
    var pickRectBlack = document.createElement('div');
    pickRectBlack.classList.add('black');
    pickRect.appendChild(pickRectBlack);


    // hue (rainbow) picker
    var pickHue = document.createElement('div');
    pickHue.classList.add('pick-hue');
    overlay.append(pickHue);


    // opacity (gradient) picker
    var pickOpacity = document.createElement('div');
    pickOpacity.classList.add('pick-opacity');
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
    fieldG.class.add('field');
    panelFields.appendChild(fieldG.element);

    // B
    var fieldB = new ui.NumberField();
    fieldB.placeholder = 'b';
    fieldB.class.add('field');
    panelFields.appendChild(fieldB.element);

    // A
    var fieldA = new ui.NumberField();
    fieldA.placeholder = 'a';
    fieldA.class.add('field');
    panelFields.appendChild(fieldA.element);

    // HEX
    var fieldHex = new ui.TextField();
    fieldHex.placeholder = '#';
    fieldHex.class.add('field');
    panelFields.appendChild(fieldHex.element);


    var root = editor.call('layout.root');
    root.append(overlay);


    // call picker
    editor.method('picker:color', function(fn) {
        overlay.hidden = false;
    });
});
