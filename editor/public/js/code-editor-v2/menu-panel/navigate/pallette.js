editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:navigate');
    const me = editor.call('editor:monaco');
    const ctrlCmd = editor.call('hotkey:ctrl:string');

    const item = menu.createItem('pallette', {
        title: 'Open Command Pallette',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.quickCommand');
        }
    });
    editor.call('menu:item:setShortcut', item, 'F1 or ' + ctrlCmd + '+Shift+P');
    menu.append(item);
});
