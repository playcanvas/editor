editor.once('load', function () {
    'use strict';

    var whoisonline = { };

    editor.method('whoisonline:set', function (list) {
        whoisonline = {};
        for (var i = 0; i < list.length; i++)
            whoisonline[list[i]] = true;

        editor.emit('whoisonline:set', whoisonline);
    });

    editor.method('whoisonline:add', function (id) {
        whoisonline[id] = true;
        editor.emit('whoisonline:add', id);
    });

    editor.method('whoisonline:remove', function (id) {
        delete whoisonline[id];
        editor.emit('whoisonline:remove', id);
    });

    editor.on('relay:connected', () => {
        if (!config.asset) return;
        editor.call('relay:joinRoom', 'codeeditor-' + config.asset.id);
    });

    editor.on('realtime:disconnected', () => {
        if (!config.asset) return;

        if (Object.keys(whoisonline).length) {
            editor.call('relay:leaveRoom', 'codeeditor-' + config.asset.id);
        }
    });

    editor.on('relay:room:join', (data) => {
        if (!config.asset) return;
        if (!data.name.startsWith('codeeditor-' + config.asset.id)) return;

        if (data.users) {
            editor.call('whoisonline:set', data.users);
        } else {
            editor.call('whoisonline:add', data.userId);
        }
    });

    editor.on('relay:room:leave', (data) => {
        if (!config.asset) return;
        if (!data.name.startsWith('codeeditor-' + config.asset.id)) return;

        if (data.userId === config.self.id) {
            editor.call('whoisonline:set', []);
        } else {
            editor.call('whoisonline:remove', data.userId);
        }
    });

});
