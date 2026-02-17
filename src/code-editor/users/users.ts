editor.once('load', () => {
    const users = { };
    const userRequests = { };

    // Loads a user from the server
    editor.method('users:loadOne', (id, callback) => {
        if (users[id]) {
            return callback(users[id]);
        }

        if (userRequests[id]) {
            return userRequests[id].push(callback);
        }

        userRequests[id] = [callback];

        editor.api.globals.rest.users.userGet(id)
        .on('load', (status, data) => {
            users[id] = data;

            for (let i = 0; i < userRequests[id].length; i++) {
                userRequests[id][i](data);
            }

            delete userRequests[id];
        });
    });

    editor.method('users:get', (id: string) => {
        return users[id] || null;
    });
});
