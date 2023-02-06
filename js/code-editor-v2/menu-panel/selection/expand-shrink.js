import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const isMac = editor.call('editor:mac');

    let item = new MenuItem({
        text: 'Expand Selection',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.smartSelect.expand');
        }
    });
    editor.call('menu:item:setShortcut', item, isMac ? 'Ctrl+Shift+Cmd+Right Arrow' : 'Shift+Alt+Right Arrow');
    menu.append(item);

    item = new MenuItem({
        text: 'Shrink Selection',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.smartSelect.shrink');
        }
    });
    editor.call('menu:item:setShortcut', item, isMac ? 'Ctrl+Shift+Cmd+Left Arrow' : 'Shift+Alt+Left Arrow');
    menu.append(item);
});
