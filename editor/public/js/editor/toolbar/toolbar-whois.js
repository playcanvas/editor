editor.once('load', function() {
    'use strict';

    var viewport = editor.call('layout.viewport');

    editor.on('whoisonline:add', function (id) {
        console.log('User ' + id + ' is now online');
    });

    editor.on('whoisonline:remove', function (id, index) {
        console.log('User ' + id + ' is no longer online');
    });
});
