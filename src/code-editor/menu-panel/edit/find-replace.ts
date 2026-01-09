import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:edit');
    const ctrl = editor.call('hotkey:ctrl:string');
    const me = editor.call('editor:monaco');
    const isMac = editor.call('editor:mac');

    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Find',
        shortcut: formatShortcut(`${ctrl}+F`),
        onSelect: () => {
            me.trigger(null, 'actions.find');
        }
    });
    menu.append(item);

    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Replace',
        shortcut: formatShortcut(isMac ? 'Alt+Cmd+F' : 'Ctrl+H'),
        onSelect: () => {
            me.trigger(null, 'editor.action.startFindReplaceAction');
        }
    });
    menu.append(item);

    item = new MenuItem({
        text: 'Find In Files',
        shortcut: formatShortcut(`${ctrl}+Shift+F`),
        onSelect: () => {
            editor.call('picker:search:open');
        }
    });
    menu.append(item);

    // hotkey
    // Register global hotkey for Find in Files so it works even when no files are open
    editor.call('hotkey:register', 'find-in-files', {
        key: 'f',
        ctrl: true,
        shift: true,
        callback: () => {
            editor.call('picker:search:open');
        }
    });
});
