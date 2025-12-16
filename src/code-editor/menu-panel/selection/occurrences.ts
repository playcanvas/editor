import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Add Next Occurrence',
        shortcut: formatShortcut(`${ctrl}+D`),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.addSelectionToNextFindMatch');
        }
    });
    menu.append(item);

    item = new MenuItem({
        text: 'Select All Occurrences',
        shortcut: formatShortcut(`${ctrl}+Shift+L`),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.selectHighlights');
        }
    });
    menu.append(item);
});
