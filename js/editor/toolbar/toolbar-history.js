import { Button } from '@playcanvas/pcui';

editor.once('load', function () {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');
    const history = editor.call('editor:history');

    // undo
    const buttonUndo = new Button({
        class: 'pc-icon',
        enabled: history.canUndo,
        hidden: !editor.call('permissions:write'),
        icon: 'E114'
    });
    toolbar.append(buttonUndo);

    history.on('canUndo', (state) => {
        buttonUndo.enabled = state;
        if (state) {
            tooltipUndo.class.remove('innactive');
        } else {
            tooltipUndo.class.add('innactive');
        }
    });
    buttonUndo.on('click', () => {
        history.undo();
    });

    const tooltipUndo = Tooltip.attach({
        target: buttonUndo.dom,
        text: 'Undo',
        align: 'left',
        root: root
    });
    if (!history.canUndo)
        tooltipUndo.class.add('innactive');


    // redo
    const buttonRedo = new Button({
        class: 'pc-icon',
        enabled: history.canRedo,
        hidden: !editor.call('permissions:write'),
        icon: 'E115'
    });
    toolbar.append(buttonRedo);

    history.on('canRedo', (state) => {
        buttonRedo.enabled = state;
        if (state) {
            tooltipRedo.class.remove('innactive');
        } else {
            tooltipRedo.class.add('innactive');
        }
    });
    buttonRedo.on('click', () => {
        history.redo();
    });

    const tooltipRedo = Tooltip.attach({
        target: buttonRedo.dom,
        text: 'Redo',
        align: 'left',
        root: root
    });
    if (!history.canRedo)
        tooltipRedo.class.add('innactive');

    editor.on('permissions:writeState', (state) => {
        buttonUndo.hidden = buttonRedo.hidden = !state;
    });
});
