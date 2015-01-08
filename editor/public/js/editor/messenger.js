editor.on('start', function() {
    'use strict';

    var messenger = new Messenger();

    messenger.connect(config.url.messenger.ws);

    messenger.on('connect', function() {
        this.authenticate(config.accessToken, 'designer');
    });

    messenger.on('welcome', function() {
        this.projectWatch(config.project.id);
    });

    messenger.on('message', function(evt) {
        editor.emit('messenger:' + evt.name, evt.data);
    });
});
