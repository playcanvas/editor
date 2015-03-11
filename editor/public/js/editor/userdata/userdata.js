editor.once('load', function() {
    'use strict';

    var userdata = new Observer();

    editor.on('userdata:raw', function (data) {
        console.log(data);
        userdata.patch(data);
    });

});
