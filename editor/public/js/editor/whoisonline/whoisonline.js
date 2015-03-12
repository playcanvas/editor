editor.once('load', function() {
    'use strict';

    var whoisonline = new ObserverList();

    // Set whoisonline
    editor.method('whoisonline:set', function (data) {
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

    // 'add' event
    whoisonline.on('add', function (id) {
        editor.emit('whoisonline:add', id);
    });

    // 'remove' event
    whoisonline.on('remove', function (id, index) {
        editor.emit('whoisonline:remove', id, index);
    });

});
