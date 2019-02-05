editor.once('load', function () {
    'use strict';

    var request = function (args, callback) {
        var request = Ajax(args);

        request.on('load', function (status, data) {
            if (data) {
                callback(null, data);
            }
        });
        request.on('error', function (status, err) {
            if (callback) {
                callback(err);
            }
        });

        return request;
    };

    editor.method('checkpoints:create', function (branchId, description, callback) {
        return request({
            url: '{{url.api}}/checkpoints',
            auth: true,
            method: 'POST',
            data: {
                projectId: config.project.id,
                branchId: branchId,
                description: description
            }
        }, callback);
    });

    editor.method('checkpoints:restore', function (id, destinationBranchId, callback) {
        return request({
            url: '{{url.api}}/checkpoints/' + id + '/restore',
            auth: true,
            method: 'POST',
            data: {
                branchId: destinationBranchId
            }
        }, callback);
    });

    editor.method('checkpoints:list', function (args, callback) {
        var url = '{{url.api}}/branches/' + args.branch + '/checkpoints';
        var separator = '?';

        if (args.limit) {
            url += separator + 'limit=' + args.limit;
            separator = '&';
        }

        if (args.skip) {
            url += separator + 'skip=' + args.skip;
            separator = '&';
        }

        return request({
            url: url,
            auth: true
        }, callback);
    });

    editor.method('checkpoints:get', function (id, callback) {
        return request({
            url: '{{url.api}}/checkpoints/' + id,
            auth: true
        }, callback);
    });

    // Gets the specified file of an asset from a specific immutable backup
    editor.method('checkpoints:getAssetFile', function (assetId, branchId, assetImmutableBackupId, filename, callback) {
        return request({
            url: '{{url.api}}/assets/' + assetId + '/file/' + filename + '?immutableBackup=' + assetImmutableBackupId + '&branchId=' + branchId,
            auth: true,
            method: 'GET',
            notJson: true
        }, callback);
    });
});
