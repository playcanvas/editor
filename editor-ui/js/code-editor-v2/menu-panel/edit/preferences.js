editor.once('load', function () {
    'use strict';

    var menu = editor.call('menu:edit');

    var group = menu.createItem('preferences', {
        title: 'Preferences',
        select: function () {
            return editor.call('picker:settings');
        }
    });
    group.class.add('preferences');
    menu.append(group);
});
