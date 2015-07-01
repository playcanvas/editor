editor.once('load', function () {
    var isSaving = false;
    var isDirty = false;

    editor.method('editor:canSave', function () {
        return isDirty && editor.call('permissions:write') && !isSaving;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    editor.method('editor:save', function () {
        if (! editor.call('editor:canSave')) return;

        isSaving = true;

        editor.emit('editor:save:start');

        var content = editor.call('editor:content');

        var data = {
            url: '/api/projects/{{project.id}}/repositories/directory/sourcefiles/{{file.name}}',
            method: 'PUT',
            query: {
                'access_token': '{{accessToken}}'
            },
            data: {
                filename: config.file.name,
                content: content
            },
            ignoreContentType: true,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };

        Ajax(data)
        .on('load', function(status, data) {
            isDirty = false;
            isSaving = false;
            editor.emit('editor:save:success');
        })
        .on('progress', function(progress) {
        })
        .on('error', function(status, data) {
            isSaving = false;
            editor.emit('editor:save:error', status);
        });
    });

    editor.method('editor:loadScript', function () {
        var data = {
            url: '/api/projects/{{project.id}}/repositories/directory/sourcefiles/{{file.name}}',
            method: 'GET',
            query: {
                'access_token': '{{accessToken}}'
            },
            notJson: true
        };

        Ajax(data)
        .on('load', function(status, data) {
            isDirty = false;
            isSaving = false;
            editor.emit('editor:loadScript', data);
        })
        .on('progress', function(progress) {
        })
        .on('error', function(status, data) {
            editor.emit('editor:loadScript:error', status);
        });
    });

    editor.on('editor:change', function () {
        isDirty = true;
    });

    editor.call('editor:loadScript');
});
