import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    const item = new MenuItem({
        text: 'Select All',
        shortcut: formatShortcut(`${ctrl}+A`),
        onSelect: () => {
            me.focus();
            const range = me.getModel().getFullModelRange();
            me.setSelection(range);
        }
    });
    menu.append(item);
});
