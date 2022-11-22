editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    const item = new pcui.MenuItem({
        text: 'Select All',
        onSelect: () => {
            me.focus();
            const range = me.getModel().getFullModelRange();
            me.setSelection(range);
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + '+A');
    menu.append(item);
});
