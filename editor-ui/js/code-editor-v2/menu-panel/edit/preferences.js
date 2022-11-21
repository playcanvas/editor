editor.once('load', function () {
    'use strict';

    const menu = editor.call('menu:edit');

    const group = menu.createItem('preferences', {
        title: 'Preferences',
        select: function () {
            return editor.call('picker:settings');
        }
    });
    group.class.add('preferences');
    menu.append(group);
});
