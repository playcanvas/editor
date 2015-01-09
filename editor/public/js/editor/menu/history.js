editor.once('load', function() {
    'use strict';

    var panelMenu = editor.call('layout.header');

    // undo
    var buttonUndo = new ui.Button({
        text: 'undo'
    });
    buttonUndo.enabled = editor.call('history:canUndo');
    panelMenu.append(buttonUndo);

    editor.on('history:canUndo', function(state) {
        buttonUndo.enabled = state;
    });

    buttonUndo.on('click', function() {
        editor.call('history:undo');
    });

    // redo
    var buttonRedo = new ui.Button({
        text: 'redo'
    });
    buttonRedo.enabled = editor.call('history:canRedo');
    panelMenu.append(buttonRedo);

    editor.on('history:canRedo', function(state) {
        buttonRedo.enabled = state;
    });

    buttonRedo.on('click', function() {
        editor.call('history:redo');
    });
});
