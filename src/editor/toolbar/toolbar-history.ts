import { Button } from '@playcanvas/pcui';

import { LegacyTooltip } from '@/common/ui/tooltip';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const toolbar = editor.call('layout.toolbar');
    const history = editor.api.globals.history;

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
            tooltipUndo.class.remove('inactive');
        } else {
            tooltipUndo.class.add('inactive');
        }
    });
    buttonUndo.on('click', () => {
        history.undo();
    });

    const tooltipUndo = LegacyTooltip.attach({
        target: buttonUndo.dom,
        text: 'Undo',
        align: 'left',
        root: root
    });
    if (!history.canUndo) {
        tooltipUndo.class.add('inactive');
    }


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
            tooltipRedo.class.remove('inactive');
        } else {
            tooltipRedo.class.add('inactive');
        }
    });
    buttonRedo.on('click', () => {
        history.redo();
    });

    const tooltipRedo = LegacyTooltip.attach({
        target: buttonRedo.dom,
        text: 'Redo',
        align: 'left',
        root: root
    });
    if (!history.canRedo) {
        tooltipRedo.class.add('inactive');
    }

    editor.on('permissions:writeState', (state) => {
        buttonUndo.hidden = buttonRedo.hidden = !state;
    });
});
