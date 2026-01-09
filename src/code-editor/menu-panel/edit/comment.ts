import { MenuItem } from '@playcanvas/pcui';

import { formatShortcut } from '../../../common/utils';

editor.once('load', () => {
    const menu = editor.call('menu:edit');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    const canEditLine = function () {
        return editor.call('editor:resolveConflictMode') || editor.call('documents:getFocused') && !editor.call('editor:isReadOnly');
    };

    // toggle comment
    let item = new MenuItem({
        class: 'no-bottom-border',
        text: 'Toggle Comment',
        shortcut: formatShortcut(`${ctrl}+/`),
        onIsEnabled: canEditLine,
        onSelect: () => {
            return editor.call('editor:command:toggleComment');
        }
    });
    menu.append(item);

    editor.method('editor:command:toggleComment', () => {
        if (!canEditLine()) {
            return;
        }
        me.focus();
        me.trigger(null, 'editor.action.commentLine');
    });

    // block comment
    item = new MenuItem({
        text: 'Block Comment',
        shortcut: formatShortcut('Shift+Alt+A'),
        onIsEnabled: canEditLine,
        onSelect: () => {
            return editor.call('editor:command:toggleBlockComment');
        }
    });
    menu.append(item);

    editor.method('editor:command:toggleBlockComment', () => {
        if (!canEditLine()) {
            return;
        }
        me.focus();
        me.trigger(null, 'editor.action.blockComment');
    });
});
