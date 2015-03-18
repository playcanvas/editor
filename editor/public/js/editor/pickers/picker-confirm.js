editor.once('load', function() {
    'use strict';

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-confirm');
    overlay.hidden = true;

    // label
    var label = new ui.Label();
    label.text = 'Are you sure?';
    label.class.add('text');
    overlay.append(label);

    // yes
    var btnYes = new ui.Button();
    btnYes.text = 'Yes';
    btnYes.class.add('yes');
    btnYes.on('click', function() {
        editor.emit('picker:confirm:yes');
        overlay.hidden = true;
    });
    overlay.append(btnYes);

    // no
    var btnNo = new ui.Button();
    btnNo.text = 'No';
    btnNo.class.add('no');
    btnNo.on('click', function() {
        editor.emit('picker:confirm:no');
        overlay.hidden = true;
    });
    overlay.append(btnNo);


    var root = editor.call('layout.root');
    root.append(overlay);


    // keyboard controlls
    window.addEventListener('keydown', function(evt) {
        if (overlay.hidden || [ 13, 27 ].indexOf(evt.keyCode) === -1)
            return;

        if (evt.keyCode === 13) {
            // yes
            btnYes.emit('click');
        } else {
            // no
            btnNo.emit('click');
        }
    }, false);


    // on overlay hide
    overlay.on('hide', function() {
        editor.emit('picker:confirm:close');
    });


    // call picker
    editor.method('picker:confirm', function(text) {
        label.text = text || 'Are you sure?';

        // show overlay
        overlay.hidden = false;
    });

    // close picker
    editor.method('picker:confirm:close', function() {
        overlay.hidden = true;
    });
});
