editor.once('load', function() {
    'use strict';


    var panel = editor.call('layout.bottom');


    editor.method('status:text', function(text) {
        panel.innerElement.textContent = text;
        panel.innerElement.classList.remove('error');
    });


    editor.method('status:error', function(text) {
        panel.innerElement.textContent = text;
        panel.innerElement.classList.add('error');
    });
});
