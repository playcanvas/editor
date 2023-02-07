editor.once('load', function () {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');

    let item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Copy Line Up',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.copyLinesUpAction');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Alt+Shift+Up Arrow');
    menu.append(item);

    item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Copy Line Down',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.copyLinesDownAction');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Alt+Shift+Down Arrow');
    menu.append(item);

    item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Move Line Up',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.moveLinesUpAction');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Alt+Up Arrow');
    menu.append(item);

    item = new pcui.MenuItem({
        class: 'no-bottom-border',
        text: 'Move Line Down',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.moveLinesDownAction');
        }
    });
    editor.call('menu:item:setShortcut', item, 'Alt+Down Arrow');
    menu.append(item);
});
