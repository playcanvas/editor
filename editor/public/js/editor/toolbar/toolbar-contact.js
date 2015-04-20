editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var contact = new ui.Button({
        text: '&#58488;'
    });
    contact.class.add('icon');
    toolbar.append(contact);

    Tooltip.attach({
        target: contact.element,
        text: 'Feedback',
        align: 'left',
        root: editor.call('layout.root')
    });

    contact.on('click', function() {
        window.open('http://forum.playcanvas.com/t/playcanvas-editor-feedback/616');
    });
});
