editor.once('load', function() {
    'use strict';

    var typing = 0;
    var typingMessage;
    var users = { };

    editor.on('whoisonline:add', function(id) {
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

    editor.on('whoisonline:remove', function(id) {
        if (! users[id])
            return;

        if (users[id].typing) {
            typing--;
            notifyTypers();
        }

        delete users[id];
    });

    var notifyTypers = function() {
        var typers = [ ];
        for(var id in users) {
            if (! users.hasOwnProperty(id) || ! users[id].typing)
                continue;

            typers.push(id);
        }

        var msg = '';

        if (typing) {
            if (typing === 1) {
                var user = editor.call('users:get', typers[0]);
                msg = (user ? user.username : 'user') + ' is typing...';
            } else if (typing === 2) {
                var userA = editor.call('users:get', typers[0]);
                var userB = editor.call('users:get', typers[1]);
                msg = (userA ? userA.username : 'user') + ' and ' + (userB ? userB.username : 'user') + ' are typing...';
            } else {
                msg = typing + ' users are typing...';
            }
        }

        editor.emit('chat:typing', typing, typers, msg);
    };

    editor.method('chat:sync:typing', function(data) {
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

    editor.method('chat:typing', function(state) {
        editor.call('realtime:send', 'chat', {
            t: 'typing',
            d: state ? 1 : 0
        });
    });
});
