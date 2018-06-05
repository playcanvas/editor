editor.once('load', function () {
    'use strict';

    editor.method('checkpoints:create', function (description, callback) {
        var request = Ajax({
            url: '{{url.api}}/checkpoints',
            auth: true,
            method: 'POST',
            data: {
                projectId: config.project.id,
                branchId: config.self.branch.id,
                description: description
            }
        });

        request
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });

        return request;
    });

    editor.method('checkpoints:restore', function (id, callback) {
        var request = Ajax({
            url: '{{url.api}}/checkpoints/' + id + '/restore',
            auth: true,
            method: 'POST',
            // TODO: remove this it's not needed when we fix assets-server->dynamo communication
            data: {
                projectId: config.project.id
            }
        });

        request
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });

        return request;
    });

    editor.method('checkpoints:list', function (args, callback) {
        var url = '{{url.api}}/branches/' + args.branch + '/checkpoints';
        var separator = '?';

        if (args.limit) {
            url += separator + 'limit=' + args.limit;
            separator = '&';
        }

        if (args.afterCheckpoint) {
            url += separator + 'afterCheckpoint=' + args.afterCheckpoint;
            separator = '&';
        }

        if (args.beforeCheckpoint) {
            url += separator + 'beforeCheckpoint=' + args.beforeCheckpoint;
            separator = '&';
        }

        var request = Ajax({
            url: url,
            auth: true
        });

        request.on('error', function (status, data) {
            if (callback) callback(data);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data.result);
        });

        return request;
    });

});
