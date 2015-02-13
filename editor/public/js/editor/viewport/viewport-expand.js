editor.once('load', function() {
    'use strict';

    var panels = [ ];
    panels.push(editor.call('layout.left'));
    panels.push(editor.call('layout.assets'));
    panels.push(editor.call('layout.right'));

    var expanded = false;

    window.addEventListener('keydown', function(evt) {
        if ((evt.target && evt.target.tagName.toLowerCase() === 'input') || evt.keyCode !== 32) // SPACE key
            return;

        expanded = ! expanded;

        for(var i = 0; i < panels.length; i++) {
            // panels[i].folded = expanded;
            panels[i].hidden = expanded;
        }
    });
});
