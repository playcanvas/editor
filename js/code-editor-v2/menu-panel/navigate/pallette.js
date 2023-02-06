import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:navigate');
    const me = editor.call('editor:monaco');
    const ctrlCmd = editor.call('hotkey:ctrl:string');

    const item = new MenuItem({
        text: 'Open Command Pallette',
        onSelect: () => {
            me.focus();
            me.trigger(null, 'editor.action.quickCommand');
        }
    });
    editor.call('menu:item:setShortcut', item, 'F1 or ' + ctrlCmd + '+Shift+P');
    menu.append(item);
});
