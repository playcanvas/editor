editor.on('start', function() {
    'use strict';

    if (typeof(Messenger) === 'undefined')
        return;

    var messenger = new Messenger();

    messenger.connect(config.url.messenger.ws);

    messenger.on('connect', function() {
        this.authenticate(config.accessToken, 'designer');
        editor.emit('messenger:connected');
    });

    messenger.on('welcome', function() {
        this.projectWatch(config.project.id);
    });

    messenger.on('message', function(evt) {
        editor.emit('messenger:' + evt.name, evt.data);
    });

    editor.method('messenger:isConnected', function () {
        return messenger.isConnected;
    });

    window.msg = messenger;
});
