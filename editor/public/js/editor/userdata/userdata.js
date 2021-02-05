editor.once('load', function () {
    'use strict';

    var userdata = new Observer();

    editor.on('userdata:' + config.self.id + ':raw', function (data) {

        if (! userdata.sync) {
            userdata.sync = new ObserverSync({
                item: userdata,
                paths: ['cameras']
            });

            // client > server
            userdata.sync.on('op', function (op) {
                if (op.oi === null) {
                    log.error('Tried to send invalid userdata op', op);
                    return;
                }

                editor.call('realtime:userdata:op', op);
            });
        }

        userdata.sync.enabled = false;
        userdata.patch(data);
        userdata.sync.enabled = true;

        editor.emit('userdata:load', userdata);
    });

    editor.method('userdata', function () {
        return userdata;
    });
});
