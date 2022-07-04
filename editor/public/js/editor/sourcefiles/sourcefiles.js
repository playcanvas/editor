editor.once('repositories:load', function (repositories) {
    'use strict';

    if (!editor.call('settings:project').get('useLegacyScripts'))
        return;

    var sourcefiles = new ObserverList();

    // get listing of sourcefiles
    Ajax({
        url: '{{url.api}}/projects/{{project.id}}/repositories/' + repositories.get('current') + '/sourcefiles',
        auth: true
    })
    .on('load', function (status, data) {
        if (data.result && data.result.length) {
            data.result.forEach(function (sourcefile) {
                var observer = new Observer(sourcefile);
                sourcefiles.add(observer);
                editor.emit('sourcefiles:add', observer);
            });
        }

        editor.emit('sourcefiles:load', sourcefiles);
    });

    editor.method('sourcefiles:list', function () {
        return sourcefiles.array();
    });

    editor.method('sourcefiles:get', function (filename) {
        var entry = sourcefiles.findOne(function (file) {
            return file.get('filename') === filename;
        });

        return entry ? entry[1] : null;
    });

    // get script full URL
    editor.method('sourcefiles:url', function (relativeUrl) {
        var fullUrl = [
            config.url.api,
            'projects',
            config.project.id,
            'repositories',
            repositories.get('current'),
            'sourcefiles',
            relativeUrl
        ].join('/');

        return fullUrl;
    });

    // get script content
    editor.method('sourcefiles:content', function (relativeUrl, callback) {
        var fullUrl = editor.call('sourcefiles:url', relativeUrl);

        Ajax({
            url: fullUrl,
            auth: true,
            notJson: true
        })
        .on('load', function (status, data) {
            if (callback)
                callback(null, data);
        })
        .on('error', function (status) {
            if (callback)
                callback(status);
        });
    });

    editor.on('sourcefiles:remove', function (sourcefile) {
        sourcefiles.remove(sourcefile);
    });

});
