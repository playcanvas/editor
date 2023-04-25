import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:edit');

    const group = new MenuItem({
        class: 'preferences',
        text: 'Preferences',
        onSelect: () => {
            return editor.call('picker:settings');
        }
    });
    menu.append(group);
});
