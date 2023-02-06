editor.once('load', function () {
    var users = { };
    var userRequests = { };

    // Creates a user (used for new organization modal in Editor CMS)
    editor.method('users:createOne', (org, success, errorFn) => {
        Ajax({
            url: '{{url.api}}/users',
            method: 'POST',
            auth: true,
            data: org
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(error);
        });
    });

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

    // Deletes a user from the server
    editor.method('users:deleteOne', (id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/users/${id}`,
            method: 'DELETE',
            auth: true,
            notJson: true
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(error);
        });
    });

    editor.method('users:get', function (id) {
        return users[id] || null;
    });

    // Gets user's collaborators
    editor.method('users:collaborators', (id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/users/${id}/collaborators`,
            method: 'GET',
            auth: true
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(status, err);
        });
    });

    // Creates a collaborator
    editor.method('users:createCollaborator', (id, newCollaborator, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${id}/collaborators`,
            method: 'POST',
            auth: true,
            data: {
                user: newCollaborator.user,
                invitation: newCollaborator.invitation,
                access_level: newCollaborator.access_level
            }
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(status, err);
        });
    });

    // Saves a collaborators access level
    editor.method('users:updateCollaboratorAccess', (id, newCollaborator, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${id}/collaborators/${newCollaborator.id}`,
            method: 'PUT',
            auth: true,
            data: {
                access_level: newCollaborator.access_level
            }
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(status, err);
        });
    });

    // Deletes a collaborator from a project
    editor.method('users:removeCollaborator', (project, collaborator, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project.id}/collaborators/${collaborator.id}`,
            method: 'DELETE',
            auth: true
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(status, err);
        });
    });

    // Updates user's number of seats
    editor.method('users:updateSubscription', (owner, data, success, errorFn) => {

        const options = {};
        Array.from(['token', 'promo', 'seats']).forEach((field) => {
            if (data[field]) options[field] = data[field];
        });
        Ajax({
            url: `{{url.api}}/payment/subscription/users/${owner.id}`,
            method: 'PUT',
            auth: true,
            data: options
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(status, error);
        });
    });

    // Gets the user's storage usage
    editor.method('users:getUsage', (id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/users/${id}/usage`,
            auth: true,
            method: 'GET'
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(status, error);
        });
    });

    // Method to determine whether a user can create private projects
    editor.method('users:allowPrivate', (projectOwner, success, errorFn) => {
        return projectOwner.plan.type !== 'free';
    });

});
