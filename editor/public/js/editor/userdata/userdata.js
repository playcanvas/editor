editor.once('load', function() {
    'use strict';

    var userdata = new Observer();

    editor.on('userdata:' + config.self.id + ':raw', function (data) {
        userdata.patch(data);

        if (! userdata.sync) {
            userdata.sync = new ObserverSync({
                item: userdata,
                paths: [ 'cameras' ]
            });

            // client > server
            userdata.sync.on('op', function(op) {
                if (op.oi === null) {
                    console.error('Tried to send invalid userdata op', op);
                    return;
                }

                editor.call('realtime:userdata:op', op);
            });
        }

        editor.emit('userdata:load', userdata);
    });

    editor.method('userdata', function () {
        return userdata;
    });
});
