import { Messenger } from '../messenger/messenger.js';

editor.on('load', function () {
    const messenger = new Messenger();

    messenger.connect(config.url.messenger.ws);

    messenger.on('connect', function () {
        this.authenticate(null, 'designer');
    });

    messenger.on('welcome', function () {
        this.projectWatch(config.project.id);
    });

    messenger.on('message', function (evt) {
        editor.emit('messenger:' + evt.name, evt.data);
    });
});
