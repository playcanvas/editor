import { MenuItem } from '@playcanvas/pcui';

editor.once('load', () => {
    const menu = editor.call('menu:selection');
    const me = editor.call('editor:monaco');
    const ctrl = editor.call('hotkey:ctrl:string');

    const item = new MenuItem({
        text: 'Select All',
        onSelect: () => {
            me.focus();
            const range = me.getModel().getFullModelRange();
            me.setSelection(range);
        }
    });
    editor.call('menu:item:setShortcut', item, `${ctrl}+A`);
    menu.append(item);
});
