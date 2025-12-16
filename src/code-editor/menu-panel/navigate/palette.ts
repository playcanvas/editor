import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:navigate');
    const me = editor.call('editor:monaco');
    const ctrlCmd = editor.call('hotkey:ctrl:string');

    const item = new MenuItem({
        text: 'Open Command Palette',
        shortcut: formatShortcut(`F1 or ${ctrlCmd}+Shift+P`),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.quickCommand');
        }
    });
    menu.append(item);
});
