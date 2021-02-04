editor.once('load', function () {
    'use strict';

    var panels = [];
    panels.push(editor.call('layout.hierarchy'));
    panels.push(editor.call('layout.assets'));
    panels.push(editor.call('layout.attributes'));

    var expanded = false;


    editor.method('viewport:expand', function (state) {
        if (state === undefined)
            state = ! expanded;

        if (expanded === state)
            return;

        expanded = state;

        for (var i = 0; i < panels.length; i++)
            panels[i].hidden = expanded;

        editor.emit('viewport:expand', state);
    });


    editor.method('viewport:expand:state', function () {
        return expanded;
    });


    // expand hotkey
    editor.call('hotkey:register', 'viewport:expand', {
        key: 'space',
        callback: function () {
            editor.call('viewport:expand');
        }
    });
});
