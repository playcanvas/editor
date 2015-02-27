editor.once('load', function() {
    'use strict';

    var panels = [ ];
    panels.push(editor.call('layout.left'));
    panels.push(editor.call('layout.assets'));
    panels.push(editor.call('layout.right'));

    var expanded = false;


    editor.method('viewport:expand', function(state) {
        if (state === undefined)
            state = ! expanded;

        if (expanded === state)
            return;

        expanded = state;

        for(var i = 0; i < panels.length; i++)
            panels[i].hidden = expanded;

        editor.emit('viewport:expand', state);
    });


    // space key
    window.addEventListener('keydown', function(evt) {
        if ((evt.target && evt.target.tagName.toLowerCase() === 'input') || evt.keyCode !== 32) // SPACE key
            return;

        editor.call('viewport:expand');
    });
});
