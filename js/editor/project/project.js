editor.once('load', function () {
    function Defer() {
        const self = this;
        self.promise = new Promise((resolve, reject) => {
            self.resolve = resolve;
            self.reject = reject;
        });
    }

    // Create a project from data
    editor.method('projects:create', (data, success, errorFn) => {
        // Prepare project data for API call
        const keys = ['name', 'description', 'private', 'private_assets', 'fork_from', 'owner', 'settings'];
        const apiData = {};
        keys.forEach((key) => {
            apiData[key] = data[key];
        });

        Ajax({
            url: '{{url.api}}/projects',
            auth: true,
            method: 'POST',
            data: apiData
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Load a single project from id
    editor.method('projects:getOne', (projectId, success, errorFn) => {
        const promise = Ajax({
            url: `{{url.api}}/projects/${projectId}`,
            auth: true
        })
        .on('load', (status, data) => {
            if (success) success(data);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(err);
        });

        return promise;
    });

    // Load current project
    editor.method('projects:getCurrent', (success) => {
        Ajax({
            url: '{{url.api}}/projects/{{project.id}}',
            auth: true
        })
        .on('load', (status, data) => {
            if (success) success(data);
        });
    });

    // Loads all the user's projects
    editor.method('projects:list', function (id, view, success) {
        return new Promise((resolve, reject) => {
            Ajax({
                url: `{{url.api}}/users/${id}/projects?view=${view}`,
                auth: true,
                method: 'GET'
            })
            .on('load', (status, response) => { resolve(response); })
            .on('error', (status, error) => { reject(error); });
        });
    });

    // Loads all the starter kits
    editor.method('projects:listStarterKits', function (success) {
        Ajax({
            url: '{{url.api}}/apps?tags=starterkit',
            method: 'GET',
            auth: true
        })
        .on('load', function (status, data) {
            if (success) success(data.result);
        });
    });

    // Save a specified project
    editor.method('projects:saveSettings', (project, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project.id}`,
            auth: true,
            method: "PUT",
            data: project
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(error);
        });
    });

    // Delete specified project
    editor.method('projects:delete', (project_id, success) => {
        Ajax({
            url: `{{url.api}}/projects/${project_id}`,
            auth: true,
            method: "DELETE",
            notJson: true
        })
        .on('load', () => {
            if (success) success();
        });
    });

    // get job status
    editor.method('projects:getJobStatus', function (jobId) {
        return new Promise((resolve, reject) => {
            Ajax({
                url: `{{url.api}}/jobs/${jobId}`,
                method: 'GET',
                auth: true
            })
            .on('load', (status, response) => {
                resolve(response);
            })
            .on('error', (status, error) => {
                reject(error);
            });
        });
    });

    // Export specified project
    editor.method('projects:export', function (project_id, success, errorFn) {
        Ajax({
            url: `{{url.api}}/projects/${project_id}/export`,
            method: "POST",
            auth: true
        })
        .on('load', function (status, result) {
            if (success) success(result);
        })
        .on('error', function (error) {
            if (errorFn) errorFn(error);
        });
    });

    // Upload specified export
    editor.method('projects:uploadExport', async function (file, progressHandler) {
        const response = await new Promise((resolve, reject) => {
            // use Ajax to get templated api url
            Ajax({
                url: `{{url.api}}/projects/upload/signed-url`,
                method: 'GET',
                auth: true
            })
            .on('progress', (progress) => {
                if (progressHandler) {
                    progressHandler(progress);
                }
            })
            .on('load', (status, response) => { resolve(response); })
            .on('error', (status, error) => { reject(error); });
        });
        const signedUrl = response.signedUrl;

        // Upload the file to S3 using the pre-signed URL
        await fetch(signedUrl, {
            method: 'PUT',
            body: file, // Pass the file object directly as the request body
            headers: {
                'Content-Type': 'application/zip' // Set the content type of the file being uploaded
            }
        });

        // return s3 key to continue process of importing project
        return { s3Key: response.s3Key };
    });

    // Imports specified project
    editor.method('projects:importNew', function (exportUrl, ownerId) {
        return new Promise((resolve, reject) => {
            Ajax({
                url: '{{url.api}}/projects/import',
                auth: true,
                method: 'POST',
                data: {
                    export_url: exportUrl,
                    owner: ownerId
                }
            })
            .on('load', (status, response) => { resolve(response); })
            .on('error', (status, error) => { reject(error); });
        });
    });

    // Unlocks locked project
    editor.method('projects:unlockOne', (project_id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project_id}/unlock`,
            auth: true,
            method: 'POST'
        })
        .on('load', (status, result) => {
            if (success) success();
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Transfers a specified project
    editor.method('projects:transfer', (project_id, new_owner_id) => {
        return new Promise((resolve, reject) => {
            Ajax({
                url: `{{url.api}}/projects/${project_id}/transfer`,
                auth: true,
                method: 'POST',
                data: {
                    owner_id: new_owner_id
                }
            })
            .on('load', (status, response) => { resolve(response); })
            .on('error', (status, error) => { reject(error); });
        });
    });

    // Accepts transferred project
    editor.method('projects:acceptTransfer', (project_id) => {
        return new Promise((resolve, reject) => {
            Ajax({
                url: `{{url.api}}/projects/${project_id}/accept_transfer`,
                auth: true,
                method: 'POST'
            })
            .on('load', (status, response) => { resolve(response); })
            .on('error', (status, error) => { reject(error); });
        });
    });

    // Decline transferred project
    editor.method('projects:declineTransfer', (project_id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project_id}/decline_transfer`,
            method: 'POST',
            auth: true
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Watches a particular project
    editor.method('projects:watch', (project_id, success, errorFn) => {
        Ajax({
            url: '{{url.api}}/watch',
            auth: true,
            method: 'POST',
            data: {
                scope: {
                    type: 'project',
                    id: project_id
                }
            }
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Unwatches a particular project
    editor.method('projects:unwatch', (watch_id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/watch/${watch_id}`,
            method: 'DELETE',
            auth: true
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Stars a particular project
    editor.method('projects:star', (star_type, project_id, success, errorFn) => {
        Ajax({
            url: '{{url.api}}/star',
            method: 'POST',
            auth: true,
            data: {
                scope: { type: star_type, id: project_id }
            }
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Unstars a particular project
    editor.method('projects:unstar', (star_id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/star/${star_id}`,
            method: 'DELETE',
            auth: true
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Fork project
    editor.method('projects:fork', (data, success, errorFn) => {
        const deferred = new Defer();

        Ajax({
            url: `{{url.api}}/projects`,
            data: data,
            method: "POST",
            auth: true
        })
        .on('load', (status, response) => {
            deferred.resolve(response);
            if (success) success(deferred.promise);
        })
        .on('error', (status, response) => {
            if (status > 0) deferred.reject(status + ': ' + response);
            if (errorFn) errorFn(deferred.promise);
        });
    });

    // Get project activity
    editor.method('projects:activity', (project_id, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project_id}/activity`,
            method: 'GET',
            auth: true
        })
        .on('load', (status, data) => {
            if (success) success(data);
        })
        .on('error', (err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Saves specified data to server
    editor.method('projects:save', (project, data, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project.id}`,
            auth: true,
            method: 'PUT',
            data: data
        })
        .on('load', (status, response) => {
            if (success) success(response);
        })
        .on('error', (status, err) => {
            if (errorFn) errorFn(err);
        });
    });

    // Gets list of project collaborators
    editor.method('projects:getCollaborators', (project, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/projects/${project.id}/collaborators`,
            auth: true,
            method: 'GET'
        })
        .on('load', (status, data) => {
            if (success) success(data.result);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(status, error);
        });
    });

    // Gets list of invitations to a project
    editor.method('projects:invitations', (options, success, errorFn) => {
        const params = [];
        let endpointURL = '{{url.api}}/invitations';

        if (options.project) {
            params.push('project_owner=' + options.project.owner);
            params.push('project_name=' + options.project.name);
        }

        if (options.username) {
            params.push('username=' + options.username);
        } else if (options.id) {
            params.push('user_id=' + options.id);
        }

        if (options.accepted) {
            params.push('accepted=' + options.accepted);
        }

        if (options.pending) {
            params.push('pending=' + options.pending);
        }

        if (params) {
            endpointURL += '?' + params.join('&');
        }

        Ajax({
            url: endpointURL,
            auth: true,
            method: 'GET'
        })
        .on('load', (status, data) => {
            if (success) success(data.result);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(error);
        });
    });

    // Creates invitation for project
    editor.method('projects:createInvitation', (project, email, permission, success, errorFn) => {
        Ajax({
            url: '{{url.api}}/invitations',
            auth: true,
            method: 'POST',
            data: {
                project_owner: project.owner,
                project_name: project.name,
                email: email,
                permission: permission
            }
        })
        .on('load', (status, data) => {
            if (success) success(data);
        })
        .on('error', (status, error) => {
            if (errorFn) errorFn(error);
        });
    });

    // Deletes invitation for project
    editor.method('projects:deleteInvitation', (invitation, success, errorFn) => {
        Ajax({
            url: `{{url.api}}/invitations/${invitation.key}`,
            auth: true,
            method: 'DELETE'
        })
        .on('load', () => {
            if (success) success();
        })
        .on('error', () => {
            if (errorFn) errorFn();
        });
    });

    editor.method('projects:setPrimaryApp', function (appId, success, errorFn) {
        var prevPrimary = config.project.primaryApp;
        config.project.primaryApp = parseInt(appId, 10);
        editor.call('projects:save', config.project, {
            primary_app: config.project.primaryApp
        }, success, function (err) {
            config.project.primaryApp = prevPrimary;
            errorFn(err);
        });
    });

    editor.on('messenger:project.primary_app', function (data) {
        var primaryApp = parseInt(data.project.primary_app, 10);
        var prev = config.project.primaryApp;

        config.project.primaryApp = primaryApp;

        editor.emit('projects:primaryApp', primaryApp, prev);
    });

});
