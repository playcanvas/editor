import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:navigate');

    let item;

    // Next tab
    item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Next Tab',
        shortcut: formatShortcut('Ctrl+Alt+.'),
        onIsEnabled: () => {
            return editor.call('tabs:list').length;
        },
        onSelect: () => {
            editor.call('editor:command:nextTab');
        }
    });
    menu.append(item);

    // hotkey
    editor.call('hotkey:register', 'next-tab', {
        key: '.',
        ctrl: true,
        alt: true,
        callback: function () {
            editor.call('editor:command:nextTab');
        }
    });


    editor.method('editor:command:nextTab', () => {
        const tabs = editor.call('tabs:list');
        if (!tabs.length) {
            return;
        }

        const focused = editor.call('tabs:focused');
        if (!focused) {
            return;
        }

        const idx = tabs.indexOf(focused);
        const next = tabs[(idx + 1) % tabs.length];
        editor.call('files:select', next.id);
    });

    // Previous tab
    item = new MenuItem({
        text: 'Previous Tab',
        shortcut: formatShortcut('Ctrl+Alt+,'),
        onIsEnabled: () => {
            return editor.call('tabs:list').length;
        },
        onSelect: () => {
            editor.call('editor:command:previousTab');
        }
    });
    menu.append(item);

    // hotkey
    editor.call('hotkey:register', 'prev-tab', {
        key: ',',
        ctrl: true,
        alt: true,
        callback: function () {
            editor.call('editor:command:previousTab');
        }
    });


    editor.method('editor:command:previousTab', () => {
        const tabs = editor.call('tabs:list');
        if (!tabs.length) {
            return;
        }

        const focused = editor.call('tabs:focused');
        if (!focused) {
            return;
        }

        let idx = tabs.indexOf(focused);
        idx--;
        if (idx < 0) {
            idx = tabs.length - 1;
        }

        const next = tabs[idx];
        editor.call('files:select', next.id);
    });

    editor.method('editor:command:selectTab', (index: number) => {
        const tabs = editor.call('tabs:list');
        const select = tabs[index];
        if (!select) {
            return;
        }

        editor.call('files:select', select.id);
    });
});
