editor.once('load', function () {
    'use strict';

    // Return if we are changing an asset instead
    // of a script.
    // TODO: Remove this when scripts are assets
    if (config.asset)
        return;

    var isLoading = true;
    var isSaving = false;

    editor.method('editor:canSave', function () {
        return editor.call('editor:isDirty') && !editor.call('editor:isReadonly') && !isSaving;
    });

    editor.method('editor:isSaving', function () {
        return isSaving;
    });

    editor.method('editor:isReadonly', function () {
        return !editor.call('permissions:write') || config.project.repositories.current !== 'directory';
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
            isSaving = false;
            editor.emit('editor:save:end');
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
            isSaving = false;
            isLoading = false;
            editor.emit('editor:loadScript', data);
        })
        .on('progress', function(progress) {
        })
        .on('error', function(status, data) {
            isLoading = false;
            editor.emit('editor:loadScript:error', status);
        });
    });

    editor.once('start', function () {
        editor.call('editor:loadScript');
    });
});
