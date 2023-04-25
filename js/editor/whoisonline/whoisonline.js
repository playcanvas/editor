import { ObserverList } from '@playcanvas/observer';

editor.once('load', function () {
    const whoisonline = new ObserverList();

    // Set whoisonline
    editor.method('whoisonline:set', function (data) {
        whoisonline.clear();
        if (data) {
            data.forEach(function (id) {
                whoisonline.add(id);
            });
        }
    });

    // Get whoisonline
    editor.method('whoisonline:get', function () {
        return whoisonline;
    });

    // Add to whoiseonline
    editor.method('whoisonline:add', function (id) {
        whoisonline.add(id);
    });

    // Remove from whoisonline
    editor.method('whoisonline:remove', function (id) {
        whoisonline.remove(id);
    });

    // Returns true if specified user id is online
    editor.method('whoisonline:find', function (id) {
        return whoisonline.indexOf(id) >= 0;
    });

    // 'add' event
    whoisonline.on('add', function (id) {
        editor.emit('whoisonline:add', id);
    });

    // 'remove' event
    whoisonline.on('remove', function (id, index) {
        editor.emit('whoisonline:remove', id, index);
    });
});
