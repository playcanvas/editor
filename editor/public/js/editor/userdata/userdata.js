editor.once('load', function() {
    'use strict';

    var userdata = new Observer();

    editor.on('userdata:raw', function (data) {
        userdata.patch(data);

        if (!userdata.sync) {
            userdata.sync = new ObserverSync({
                item: userdata,
                paths: ['cameras']
            });

            // client > server
            userdata.sync.on('op', function(op) {
                editor.call('realtime:userdata:op', op);
            });
        }

        editor.emit('userdata:load', userdata);
    });

    // server > client
    editor.on('realtime:userdata:op', function(op) {
        console.log(op);
    });

    // Gets userdata
    editor.method('userdata', function () {
        return userdata;
    });

});
