editor.once('load', function() {
    'use strict';

    window.addEventListener('error', function(evt) {
        // console.log(evt);
        editor.call('status:error', evt.message);
    }, false);
});
