import { MenuItem } from '@playcanvas/pcui';

editor.once('load', function () {
    const menu = editor.call('menu:edit');

    const group = new MenuItem({
        text: 'Preferences',
        onSelect: () => {
            return editor.call('picker:settings');
        }
    });
    group.class.add('preferences');
    menu.append(group);
});
