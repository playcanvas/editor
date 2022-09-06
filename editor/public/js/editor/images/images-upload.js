editor.once('load', function () {
    editor.method('images:upload', function (file, project, callback, error) {
        if (!file || !file.size)
            return;

        var form = new FormData();
        form.append('file', file);

        var data = {
            url: `/api/projects/${project.id}/image`,
            method: 'POST',
            auth: true,
            data: form,
            ignoreContentType: true,
            headers: {
                Accept: 'application/json'
            }
        };

        Ajax(data)
        .on('load', function (status, data) {
            if (callback)
                callback(data);
        })
        .on('progress', function (progress) {
        })
        .on('error', function (status, data) {
            if (error)
                error(status, data);
        });
    });
});
