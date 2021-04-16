editor.once('load', function () {
    'use strict';

    let typing = 0;
    const users = { };

    const notifyTypers = function () {
        const typers = [];
        for (const id in users) {
            if (! users.hasOwnProperty(id) || ! users[id].typing)
                continue;

            typers.push(id);
        }

        editor.emit('chat:typing', typing, typers, msg);
    };

    editor.on('whoisonline:add', function (id) {
        if (users[id])
            return;

        users[id] = {
            id: id,
            typing: 0,
            username: ''
        };

        editor.call('users:loadOne', id, function (user) {
            if (! users[id])
                return;

            users[id].username = user.username;
        });
    });

    editor.on('whoisonline:remove', function (id) {
        if (! users[id])
            return;

        if (users[id].typing) {
            typing--;
            notifyTypers();
        }

        delete users[id];
    });

    editor.method('chat:sync:typing', function (data) {
        if (! users[data.user] || data.user === config.self.id || users[data.user].typing === data.d)
            return;

        users[data.user].typing = data.d;

        if (data.d) {
            typing++;
        } else {
            typing--;
        }

        notifyTypers();
    });

    editor.method('chat:typing', function (state) {
        editor.call('realtime:send', 'chat', {
            t: 'typing',
            d: state ? 1 : 0
        });
    });
});
