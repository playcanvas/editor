editor.once('load', function () {

    // Make ajax request
    var request = function (args, callback) {
        Ajax(args)
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });
    };

    // Load project branches
    // args.limit: the limit
    // args.skip: the number of entries to skip
    // args.closed: If true only return closed branches
    editor.method('branches:list', function (args, callback) {
        var url = '{{url.api}}/projects/{{project.id}}/branches';
        var separator = '?';
        if (args.limit) {
            url += separator + 'limit=' + args.limit;
            separator = '&';
        }

        if (args.skip) {
            url += separator + 'skip=' + args.skip;
            separator = '&';
        }

        if (args.closed) {
            url += separator + 'closed=true';
        }

        request({
            url: url,
            auth: true
        }, callback);
    });

    // Creates a branch
    editor.method('branches:create', function (name, callback) {
        request({
            url: '{{url.api}}/branches',
            method: 'POST',
            data: {
                project: config.project.id,
                name: name
            },
            auth: true
        }, callback);
    });

    // Checks out a branch
    editor.method('branches:checkout', function (id, callback) {
        request({
            url: '{{url.api}}/branches/' + id + '/checkout',
            method: 'POST',
            auth: true
        }, callback);
    });

    // Close branch
    editor.method('branches:close', function (id, callback) {
        request({
            url: '{{url.api}}/branches/' + id + '/close',
            method: 'POST',
            auth: true
        }, callback);
    });

    // Open branch
    editor.method('branches:open', function (id, callback) {
        request({
            url: '{{url.api}}/branches/' + id + '/open',
            method: 'POST',
            auth: true
        }, callback);
    });
});