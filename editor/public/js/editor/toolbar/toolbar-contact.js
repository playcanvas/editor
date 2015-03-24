editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var contact = new ui.Button({
        text: '&#58488;'
    });
    contact.element.title = 'Feedback Forum';
    contact.class.add('icon');
    toolbar.append(contact);

    contact.on('click', function() {
        window.open('http://forum.playcanvas.com/t/playcanvas-editor-feedback/616');
    });
});
