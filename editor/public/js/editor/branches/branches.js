editor.once('load', function () {
    // Load project branches
    // args.limit: the limit
    // args.skip: the number of entries to skip
    // args.archived: true to return archived branches
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

        if (args.archived) {
            url += separator + 'archived=true';
        }

        Ajax({
            url: url,
            auth: true
        })
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });
    });

    // Creates a branch
    editor.method('branches:create', function (name, callback) {
        Ajax({
            url: '{{url.api}}/branches',
            method: 'POST',
            data: {
                name: name
            },
            auth: true
        })
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });
    });
});