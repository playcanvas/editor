editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');

    let item = menu.createItem('copy-line-up', {
        title: 'Copy Line Up',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.copyLinesUpAction');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Alt+Shift+Up Arrow');
    menu.append(item);

    item = menu.createItem('copy-line-down', {
        title: 'Copy Line Down',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.copyLinesDownAction');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Alt+Shift+Down Arrow');
    menu.append(item);

    item = menu.createItem('move-line-up', {
        title: 'Move Line Up',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.moveLinesUpAction');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, 'Alt+Up Arrow');
    menu.append(item);

    item = menu.createItem('move-line-down', {
        title: 'Move Line Down',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.moveLinesDownAction');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Alt+Down Arrow');
    menu.append(item);
});
