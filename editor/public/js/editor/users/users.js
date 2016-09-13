editor.once('load', function() {
    'use strict';

    var users = { };
    var userRequests = { };

    // Loads a user from the server
    editor.method('users:loadOne', function (id, callback) {
        if (users[id])
            return callback(users[id]);

        if (userRequests[id])
            return userRequests[id].push(callback);

        userRequests[id] = [ callback ];

        Ajax.get('{{url.api}}/users/' + id + '?access_token={{accessToken}}')
        .on('load', function (status, data) {
            users[id] = data;

            for(var i = 0; i < userRequests[id].length; i++)
                userRequests[id][i](data);

            delete userRequests[id];
        });
    });

    editor.method('users:get', function(id) {
        return users[id] || null;
    });
});
