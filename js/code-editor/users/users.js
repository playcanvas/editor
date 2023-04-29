import { Ajax } from '../../common/ajax.js';

editor.once('load', function () {
    const users = { };
    const userRequests = { };

    // Loads a user from the server
    editor.method('users:loadOne', function (id, callback) {
        if (users[id])
            return callback(users[id]);

        if (userRequests[id])
            return userRequests[id].push(callback);

        userRequests[id] = [callback];

        Ajax({
            url: '{{url.api}}/users/' + id,
            auth: true
        })
        .on('load', function (status, data) {
            users[id] = data;

            for (let i = 0; i < userRequests[id].length; i++)
                userRequests[id][i](data);

            delete userRequests[id];
        });
    });

    editor.method('users:get', function (id) {
        return users[id] || null;
    });
});
