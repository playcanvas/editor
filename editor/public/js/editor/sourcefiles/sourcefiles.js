editor.once('repositories:load', function (repositories) {
    'use strict';

    var sourcefiles = new ObserverList();

    // get listing of sourcefiles
    Ajax
    .get('{{url.api}}/projects/{{project.id}}/repositories/' + repositories.get('current') + '/sourcefiles?access_token=' + config.accessToken)
    .on('load', function (status, data) {
        if (data.response && data.response.length) {
            data.response.forEach(function (sourcefile) {
                sourcefiles.add(new Observer(sourcefile));
            });
        }

        editor.emit('sourcefiles:load', sourcefiles);
    });

    editor.method('sourcefiles:get', function () {
        return sourcefiles;
    });


    // get script full URL
    editor.method('sourcefiles:url', function (relativeUrl) {
        var fullUrl = [
            config.url.api,
            'files',
            'code',
            config.project.id,
            'master',
            repositories.get('current'),
            repositories.get(repositories.get('current') + '.username'),
            repositories.get(repositories.get('current') + '.repo'),
            relativeUrl
        ].join('/');

        return fullUrl;
    });

    editor.method('sourcefiles:create', function (url, callback) {
        var data = {
            filename: url,
            content: editor.call('sourcefiles:skeleton', url)
        };

        var createUrl = [config.url.api, 'projects', config.project.id, 'repositories', repositories.get('current'), 'sourcefiles', url].join('/');
        createUrl += '?access_token=' + config.accessToken;

        Ajax
        .put(createUrl, data)
        .on('load', function (status, data) {
            if (callback) {
                callback(data.response[0]);
            }
        });
    });

});
