editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:edit');
    const ctrl = editor.call('hotkey:ctrl:string');
    const me = editor.call('editor:monaco');
    const isMac = editor.call('editor:mac');

    let item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Find',
        onSelect: () => {
            me.trigger(null, 'actions.find');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+F');
    menu.append(item);

    item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Replace',
        onSelect: () => {
            me.trigger(null, 'editor.action.startFindReplaceAction');
        }
    });
    editor.call('menu:item:setShortcut', item, isMac ? 'Alt+Cmd+F' : 'Ctrl+H');
    menu.append(item);

    item = new pcui.MenuItem({
        text: 'Find In Files',
        onSelect: () => {
            editor.call('picker:search:open');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + 'Shift+F');
    menu.append(item);
});
