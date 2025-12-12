import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');

    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Copy Line Up',
        shortcut: formatShortcut('Alt+Shift+Up Arrow'),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.copyLinesUpAction');
        }
    });
    menu.append(item);

    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Copy Line Down',
        shortcut: formatShortcut('Alt+Shift+Down Arrow'),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.copyLinesDownAction');
        }
    });
    menu.append(item);

    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Move Line Up',
        shortcut: formatShortcut('Alt+Up Arrow'),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.moveLinesUpAction');
        }
    });
    menu.append(item);

    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Move Line Down',
        shortcut: formatShortcut('Alt+Down Arrow'),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.moveLinesDownAction');
        }
    });
    menu.append(item);
});
