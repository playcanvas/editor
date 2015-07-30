editor.once('load', function() {
    'use strict';

    editor.method('cursor:set', function(type) {
        document.body.style.cursor = type;
    });

    editor.method('cursor:clear', function() {
        document.body.style.cursor = '';
    });
});
