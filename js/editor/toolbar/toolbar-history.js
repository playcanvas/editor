import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    'use strict';

    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');
    const history = editor.call('editor:history');

    // undo
    const buttonUndo = new Button({
        icon: 'E114'
    });
    buttonUndo.hidden = !editor.call('permissions:write');
    buttonUndo.class.add('pc-icon');
    buttonUndo.enabled = history.canUndo;
    toolbar.append(buttonUndo);

    history.on('canUndo', function (state) {
        buttonUndo.enabled = state;
        if (state) {
            tooltipUndo.class.remove('innactive');
        } else {
            tooltipUndo.class.add('innactive');
        }
    });
    buttonUndo.on('click', function () {
        history.undo();
    });

    const tooltipUndo = Tooltip.attach({
        target: buttonUndo.element,
        text: 'Undo',
        align: 'left',
        root: root
    });
    if (!history.canUndo)
        tooltipUndo.class.add('innactive');


    // redo
    const buttonRedo = new Button({
        icon: 'E115'
    });
    buttonRedo.hidden = !editor.call('permissions:write');
    buttonRedo.class.add('pc-icon');
    buttonRedo.enabled = history.canRedo;
    toolbar.append(buttonRedo);

    history.on('canRedo', function (state) {
        buttonRedo.enabled = state;
        if (state) {
            tooltipRedo.class.remove('innactive');
        } else {
            tooltipRedo.class.add('innactive');
        }
    });
    buttonRedo.on('click', function () {
        history.redo();
    });

    const tooltipRedo = Tooltip.attach({
        target: buttonRedo.element,
        text: 'Redo',
        align: 'left',
        root: root
    });
    if (!history.canRedo)
        tooltipRedo.class.add('innactive');

    editor.on('permissions:writeState', function (state) {
        buttonUndo.hidden = buttonRedo.hidden = !state;
    });
});
