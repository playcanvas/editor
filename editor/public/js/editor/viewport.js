editor.on('load', function() {
    'use strict';

    // deselecting
    editor.call('layout.viewport').on('click', function() {
        editor.call('selector:clear');
    });
});
