editor.once('load', function() {
    'use strict';

    var assetsPanel = editor.call('layout.assets');
    var uploadJobs = 0;

    var uploadFile = function(file, fn) {
        var form = new FormData();
        form.append('file', file, file.name);

        var job = ++uploadJobs;
        editor.call('status:job', 'asset-upload:' + job, 0);

        Ajax({
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
        })
        .on('load', function(status, data) {
            editor.call('status:text', data);
            editor.call('status:job', 'asset-upload:' + job);
        })
        .on('progress', function(progress) {
            editor.call('status:job', 'asset-upload:' + job, progress);
        })
        .on('error', function(status, data) {
            editor.call('status:error', data);
            editor.call('status:job', 'asset-upload:' + job);
        });
    };

    var dropRef = editor.call('drop:target', {
        ref: assetsPanel.element,
        type: 'files',
        drop: function(type, data) {
            if (type !== 'files' || ! editor.call('permissions:write'))
                return;

            for(var i = 0; i < data.length; i++) {
                uploadFile(data[i]);
            }
        }
    });

    dropRef.element.classList.add('assets-drop-area');
});
