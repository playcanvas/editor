import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const isMac = editor.call('editor:mac');

    let item = new MenuItem({
        text: 'Expand Selection',
        shortcut: formatShortcut(isMac ? 'Ctrl+Shift+Cmd+Right Arrow' : 'Shift+Alt+Right Arrow'),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.smartSelect.expand');
        }
    });
    menu.append(item);

    item = new MenuItem({
        text: 'Shrink Selection',
        shortcut: formatShortcut(isMac ? 'Ctrl+Shift+Cmd+Left Arrow' : 'Shift+Alt+Left Arrow'),
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.smartSelect.shrink');
        }
    });
    menu.append(item);
});
