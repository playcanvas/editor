editor.once('load', function () {
    const panel = editor.call('chat:panel');
    let number = 0;

    editor.on('visibility', function (state) {
        if (state) {
            number = 0;
            editor.call('notify:title', `${config.project.name} | Editor`);
        } else {
            number = editor.call('chat:unreadCount');
            if (number) {
                editor.call('notify:title', `(${number}) ${config.project.name} | Editor`);
            }
        }
    });

    editor.on('chat:post', function (type, msg, element) {
        editor.call('notify:permission');

        const granted = editor.call('localStorage:get', 'editor:notifications:chat');
        const visible = editor.call('visibility');

        if (!visible) {
            number++;
            editor.call('notify:title', `(${number}) ${config.project.name} | Editor`);
        }

        if (visible || granted === false)
            return;

        let title;
        let icon;
        if (msg.length > 64)
            msg = msg.slice(0, 64) + '...';

        if (type === 'system') {
            title = 'System Message';
        } else if (typeof type === 'number') {
            const user = editor.call('users:get', type);
            title = 'Message from ' + (user && ('@' + user.username) || 'a user');
            icon = `/api/users/${user.id}/thumbnail?size=128`;
        }

        editor.call('notify', {
            title: title,
            body: msg,
            icon: icon,
            click: function () {
                window.focus();
                panel.collapsed = false;
            }
        });
    });
});
