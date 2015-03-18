editor.once('load', function() {
    'use strict';

    var callback = null;

    // overlay
    var overlay = new ui.Overlay();
    overlay.class.add('picker-confirm');
    overlay.hidden = true;

    // label
    var label = new ui.Label();
    label.text = 'Are you sure?';
    label.class.add('text');
    label.renderChanges = false;
    overlay.append(label);

    // yes
    var btnYes = new ui.Button();
    btnYes.text = 'Yes';
    btnYes.class.add('yes');
    btnYes.on('click', function() {
        editor.emit('picker:confirm:yes');

        if (callback)
            callback();

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


    // esc > no
    editor.call('hotkey:register', 'picker:confirm:no', {
        key: 'esc',
        callback: function() {
            if (overlay.hidden)
                return;

            btnNo.emit('click');
        }
    });

    // enter > yes
    editor.call('hotkey:register', 'picker:confirm:yes', {
        key: 'enter',
        callback: function() {
            if (overlay.hidden)
                return;

            btnYes.emit('click');
        }
    });


    // on overlay hide
    overlay.on('hide', function() {
        editor.emit('picker:confirm:close');
    });


    // call picker
    editor.method('picker:confirm', function(text, fn) {
        label.text = text || 'Are you sure?';
        callback = fn || null;

        // show overlay
        overlay.hidden = false;
    });

    // close picker
    editor.method('picker:confirm:close', function() {
        overlay.hidden = true;
    });
});
