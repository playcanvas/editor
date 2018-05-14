editor.once('load', function () {
    'use strict';

    editor.method('checkpoints:create', function (data, callback) {
        Ajax({
            url: '{{url.api}}/checkpoint',
            auth: true,
            method: 'POST',
            data: data
        })
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });
    });

    editor.method('checkpoints:restore', function (checkpointId, callback) {
        Ajax({
            url: '{{url.api}}/checkpoint/' + checkpointId + '/restore',
            auth: true,
            method: 'POST',
            data: {
                project_id: config.project.id
            }
        })
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });
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

        Ajax({
            url: url,
            auth: true
        })
        .on('error', function (status, data) {
            if (callback) callback(data);
        })
        .on('load', function (status, data) {
            setTimeout(function () {
                if (callback) callback(null, data);
            }, 2000);
        });
    });
    
});