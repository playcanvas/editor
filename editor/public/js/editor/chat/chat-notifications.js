editor.once('load', function() {
    'use strict';

    var panel = editor.call('chat:panel');
    var inputField = editor.call('chat:inputField');
    var number = 0;

    editor.on('visibility', function(state) {
        if (state) {
            number = 0;
            editor.call('notify:title', config.project.name + ' | Editor');
        } else {
            number = editor.call('chat:unreadCount');
            if (number) editor.call('notify:title', '(' + number + ') ' + config.project.name + ' | Editor');
        }
    });

    editor.on('chat:post', function(type, msg, element) {
        editor.call('notify:permission');

        var granted = editor.call('localStorage:get', 'editor:notifications:chat');
        var visible = editor.call('visibility');

        if (! visible) {
            number++;
            editor.call('notify:title', '(' + number + ') ' + config.project.name + ' | Editor');
        }

        if (visible || granted === false)
            return;

        var title;
        var icon;
        if (msg.length > 64)
            msg = msg.slice(0, 64) + '...';

        if (type === 'system') {
            title = 'System Message';

        } else if (typeof(type) === 'number') {
            var user = editor.call('users:get', type);
            title = 'Message from ' + (user && ('@' + user.username) || 'a user');
            icon = '/api/' + user.id + '/thumbnail?size=128'
        }

        editor.call('notify', {
            title: title,
            body: msg,
            icon: icon,
            click: function() {
                window.focus();
                panel.folded = false;
            }
        });
    });
});
