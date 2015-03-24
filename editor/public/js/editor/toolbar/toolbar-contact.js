editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    var contact = new ui.Button({
        text: '&#58418;'
    });
    contact.element.title = 'Contact';
    contact.class.add('icon');
    toolbar.append(contact);

    contact.on('click', function() {
        window.location.href = 'mailto:contact@playcanvas.com';
    });
});
