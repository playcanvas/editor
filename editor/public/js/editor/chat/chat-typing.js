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

    editor.on('relay:room:join', function (data) {
        if (data.name !== 'project-' + config.project.id) return;

        function addUser(id) {
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
        }

        if (data.users) {
            data.users.forEach(addUser);
        } else {
            addUser(data.userId);
        }
    });

    editor.on('relay:room:leave', function (data) {
        if (data.name !== 'project-' + config.project.id) return;

        const id = data.userId;
        if (! users[id])
            return;

        if (users[id].typing) {
            typing--;
            notifyTypers();
        }

        delete users[id];
    });

    editor.method('chat:sync:typing', function (data) {
        if (! users[data.from] || data.from === config.self.id || users[data.from].typing === data.d)
            return;

        users[data.from].typing = data.d;

        if (data.d) {
            typing++;
        } else {
            typing--;
        }

        notifyTypers();
    });

    editor.method('chat:typing', function (state) {
        editor.call('relay:broadcast', 'project-' + config.project.id, {
            chat: 'typing',
            d: state ? 1 : 0
        });
    });

    editor.on('relay:room:msg', data => {
        if (data.msg.chat === 'typing') {
            editor.call('chat:sync:typing', {
                from: data.from,
                d: data.msg.d
            });
        }
    });
});
