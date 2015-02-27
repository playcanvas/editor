editor.once('load', function() {
    'use strict';

    var toolbar = editor.call('layout.toolbar');

    // undo
    var buttonUndo = new ui.Button({
        text: '&#57654;'
    });
    buttonUndo.element.title = 'Undo';
    buttonUndo.class.add('icon');
    buttonUndo.enabled = editor.call('history:canUndo');
    toolbar.append(buttonUndo);

    editor.on('history:canUndo', function(state) {
        buttonUndo.enabled = state;
    });

    buttonUndo.on('click', function() {
        editor.call('history:undo');
    });

    // redo
    var buttonRedo = new ui.Button({
        text: '&#57655;'
    });
    buttonRedo.element.title = 'Redo';
    buttonRedo.class.add('icon');
    buttonRedo.enabled = editor.call('history:canRedo');
    toolbar.append(buttonRedo);

    editor.on('history:canRedo', function(state) {
        buttonRedo.enabled = state;
    });

    buttonRedo.on('click', function() {
        editor.call('history:redo');
    });
});
