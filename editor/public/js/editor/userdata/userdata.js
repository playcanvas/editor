editor.once('load', function() {
    'use strict';

    var userdata = new Observer();

    editor.on('userdata:' + config.self.id + ':raw', function (data) {

        userdata.sync = new ObserverSync({
            item: userdata,
            paths: [ 'cameras' ]
        });

        // client > server
        var evt = userdata.sync.on('op', function(op) {
            if (op.oi === null) {
                console.error('Tried to send invalid userdata op', op);
                return;
            }

            editor.call('realtime:userdata:op', op);
        });

        editor.once('scene:unload', function () {
            if (evt) {
                evt.unbind();
                evt = null;
            }
        });

        editor.once('realtime:disconnected', function () {
            if (evt) {
                evt.unbind();
                evt = null;
            }
        });

        userdata.sync.enabled = false;
        userdata.patch(data);
        userdata.sync.enabled = true;

        editor.emit('userdata:load', userdata);
    });

    editor.method('userdata', function () {
        return userdata;
    });
});
