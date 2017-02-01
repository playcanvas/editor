editor.once('load', function () {
    'use strict';

    var hasError = false;

    // if we get a realtime error then make everything
    // read only as it can be anything.
    // TODO: Would be nice if we could figure out if we really
    // need to do this but the errors could literally be anything
    // from socket errors to sharejs errors
    editor.on('realtime:error', function (err) {
        hasError = true;
        console.error(err);
        editor.call('status:permanentError', 'There was a realtime error that the Code Editor could not recover from. Please refresh the Code Editor.');
        editor.emit('permissions:writeState', false);
    });

    editor.method('errors:hasRealtime', function () {
        return hasError;
    });
});