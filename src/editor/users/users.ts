editor.once('load', () => {
    const users = { };
    const userRequests = { };

    // Creates a user (used for new organization modal in Editor CMS)
    editor.method('users:createOne', (org, success, errorFn) => {
        editor.api.globals.rest.users.userCreate(org)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, error) => {
            if (errorFn) {
                errorFn(error);
            }
        });
    });

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

    // Deletes a user from the server
    editor.method('users:deleteOne', (id, success, errorFn) => {
        editor.api.globals.rest.users.userDelete(id)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, error) => {
            if (errorFn) {
                errorFn(error);
            }
        });
    });

    editor.method('users:get', (id: string) => {
        return users[id] || null;
    });

    // Gets user's collaborators
    editor.method('users:collaborators', (id, success, errorFn) => {
        editor.api.globals.rest.users.userCollabList(id)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, err) => {
            if (errorFn) {
                errorFn(status, err);
            }
        });
    });

    // Creates a collaborator
    editor.method('users:createCollaborator', (id, newCollaborator, success, errorFn) => {
        editor.api.globals.rest.projects.projectCollabCreate(id, newCollaborator)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, err) => {
            if (errorFn) {
                errorFn(status, err);
            }
        });
    });

    // Saves a collaborators access level
    editor.method('users:updateCollaboratorAccess', (id, newCollaborator, success, errorFn) => {
        editor.api.globals.rest.projects.projectCollabUpdate(id, newCollaborator)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, err) => {
            if (errorFn) {
                errorFn(status, err);
            }
        });
    });

    // Deletes a collaborator from a project
    editor.method('users:removeCollaborator', (project, collaborator, success, errorFn) => {
        editor.api.globals.rest.projects.projectCollabDelete(project.id, collaborator.id)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, err) => {
            if (errorFn) {
                errorFn(status, err);
            }
        });
    });

    // Updates user's number of seats
    editor.method('users:updateSubscription', (owner, data, success, errorFn) => {

        const options = {};
        Array.from(['token', 'promo', 'seats']).forEach((field: string) => {
            if (data[field]) {
                options[field] = data[field];
            }
        });
        editor.api.globals.rest.payment.paymentSubUpdate(owner.id, options)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, error) => {
            if (errorFn) {
                errorFn(status, error);
            }
        });
    });

    // Gets the user's storage usage
    editor.method('users:getUsage', (id, success, errorFn) => {
        editor.api.globals.rest.users.userUsage(id)
        .on('load', (status, response) => {
            if (success) {
                success(response);
            }
        })
        .on('error', (status, error) => {
            if (errorFn) {
                errorFn(status, error);
            }
        });
    });

    // Method to determine whether a user can create private projects
    editor.method('users:allowPrivate', (projectOwner, success, errorFn) => {
        return projectOwner.plan.type !== 'free';
    });

});
