editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    const item = menu.createItem('select-all', {
        title: 'Select All',
        select: function () {
            me.focus();
            const range = me.getModel().getFullModelRange();
            me.setSelection(range);
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+A');
    menu.append(item);
});
