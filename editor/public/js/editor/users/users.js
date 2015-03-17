editor.once('load', function() {
    'use strict';

    // Loads a user from the server
    editor.method('users:loadOne', function (id, callback) {
        Ajax.get('{{url.api}}/users/' + id + '?access_token={{accessToken}}')
        .on('load', function (status, data) {
            callback(data.response[0]);
        });
    });
});
