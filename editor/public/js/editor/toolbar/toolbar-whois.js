editor.once('load', function() {
    'use strict';

    var viewport = editor.call('layout.viewport');

    var userA = document.createElement('div');
    userA.id = 'user-a';
    viewport.append(userA);

    var userB = document.createElement('div');
    userB.id = 'user-b';
    viewport.append(userB);
});
