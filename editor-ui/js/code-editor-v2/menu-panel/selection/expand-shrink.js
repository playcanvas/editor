editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const isMac = editor.call('editor:mac');

    let item = menu.createItem('expand-selection', {
        title: 'Expand Selection',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.smartSelect.expand');
        }
    });
    item.class.add('noBorder');
    editor.call('menu:item:setShortcut', item, isMac ? 'Ctrl+Shift+Cmd+Right Arrow' : 'Shift+Alt+Right Arrow');
    menu.append(item);

    item = menu.createItem('shrink-selection', {
        title: 'Shrink Selection',
        select: function () {
            me.focus();
            me.trigger(null, 'editor.action.smartSelect.shrink');
        }
    });
    editor.call('menu:item:setShortcut', item, isMac ? 'Ctrl+Shift+Cmd+Left Arrow' : 'Shift+Alt+Left Arrow');
    menu.append(item);
});
