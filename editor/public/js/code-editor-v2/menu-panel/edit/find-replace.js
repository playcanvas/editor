editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:edit');
    const ctrl = editor.call('hotkey:ctrl:string');
    const me = editor.call('editor:monaco');
    const isMac = editor.call('editor:mac');

    let item = menu.createItem('find', {
        title: 'Find',
        select: function () {
            me.trigger(null, 'actions.find');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, ctrl + '+F');
    menu.append(item);

    item = menu.createItem('replace', {
        title: 'Replace',
        select: function () {
            me.trigger(null, 'editor.action.startFindReplaceAction');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, isMac ? 'Alt+Cmd+F' : 'Ctrl+H');
    menu.append(item);

    item = menu.createItem('find-in-files', {
        title: 'Find In Files',
        select: function () {
            editor.call('picker:search:open');
        }
    });
    editor.call('menu:item:setShortcut', item, ctrl + 'Shift+F');
    menu.append(item);
});
