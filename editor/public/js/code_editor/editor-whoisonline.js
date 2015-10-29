editor.once('load', function () {
    'use strict';

    var whoisonline = { };

    editor.method('whoisonline:set', function (list) {
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
});
