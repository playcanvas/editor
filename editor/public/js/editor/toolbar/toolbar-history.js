editor.once('load', function() {
    'use strict';

    var root = editor.call('layout.root');
    var toolbar = editor.call('layout.toolbar');


    // undo
    var buttonUndo = new ui.Button({
        text: '&#57620;'
    });
    buttonUndo.hidden = ! editor.call('permissions:write');
    buttonUndo.class.add('pc-icon');
    buttonUndo.enabled = editor.call('history:canUndo');
    toolbar.append(buttonUndo);

    editor.on('history:canUndo', function(state) {
        buttonUndo.enabled = state;
        if (state) {
            tooltipUndo.class.remove('innactive');
        } else {
            tooltipUndo.class.add('innactive');
        }
    });
    buttonUndo.on('click', function() {
        editor.call('history:undo');
    });

    var tooltipUndo = Tooltip.attach({
        target: buttonUndo.element,
        text: 'Undo',
        align: 'left',
        root: root
    });
    if (! editor.call('history:canUndo'))
        tooltipUndo.class.add('innactive');


    // redo
    var buttonRedo = new ui.Button({
        text: '&#57621;'
    });
    buttonRedo.hidden = ! editor.call('permissions:write');
    buttonRedo.class.add('pc-icon');
    buttonRedo.enabled = editor.call('history:canRedo');
    toolbar.append(buttonRedo);

    editor.on('history:canRedo', function(state) {
        buttonRedo.enabled = state;
        if (state) {
            tooltipRedo.class.remove('innactive');
        } else {
            tooltipRedo.class.add('innactive');
        }
    });
    buttonRedo.on('click', function() {
        editor.call('history:redo');
    });

    var tooltipRedo = Tooltip.attach({
        target: buttonRedo.element,
        text: 'Redo',
        align: 'left',
        root: root
    });
    if (! editor.call('history:canUndo'))
        tooltipRedo.class.add('innactive');

    editor.on('permissions:writeState', function(state) {
        buttonUndo.hidden = buttonRedo.hidden = ! state;
    });
});



