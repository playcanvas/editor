editor.once('load', function() {
    'use strict';


    var panel = editor.call('layout.bottom');


    editor.hook('status:text', function(text) {
        panel.innerElement.textContent = text;
    });
});
