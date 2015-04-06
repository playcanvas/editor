editor.once('load', function() {
    'use strict';

    var uploadJobs = 0;

    editor.method('assets:uploadFile', function (file, name, asset, fn) {
        var form = new FormData();
        form.append('file', file, name);

        var job = ++uploadJobs;
        editor.call('status:job', 'asset-upload:' + job, 0);

        var data = {
            url: '/editor/project/{{project.id}}/asset-upload',
            method: 'POST',
            query: {
                'access_token': '{{accessToken}}'
            },
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        };

        if (asset) {
            data.query.asset = asset.get('id');
        }

        Ajax(data)
        .on('load', function(status, data) {
            editor.call('status:text', data);
            editor.call('status:job', 'asset-upload:' + job);
            if (fn)
                fn(null, data);
        })
        .on('progress', function(progress) {
            editor.call('status:job', 'asset-upload:' + job, progress);
        })
        .on('error', function(status, data) {
            editor.call('status:error', data);
            editor.call('status:job', 'asset-upload:' + job);
            if (fn)
                fn(data);
        });
    });

});
