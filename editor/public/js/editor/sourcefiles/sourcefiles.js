editor.once('repositories:load', function (repositories) {
    'use strict';

    // get script full URL
    editor.method('sourcefiles:url', function (relativeUrl) {
        var fullUrl = [
            config.url.api,
            'files',
            'code',
            config.project.id,
            'master',
            repositories.current,
            repositories[repositories.current].username,
            repositories[repositories.current].repo,
            relativeUrl
        ].join('/');

        return fullUrl;
    });

    editor.method('sourcefiles:create', function (url, callback) {
        var data = {
            filename: url,
            content: editor.call('sourcefiles:skeleton', url)
        };

        var createUrl = [config.url.api, 'projects', config.project.id, 'repositories', repositories.current, 'sourcefiles', url].join('/');
        createUrl += '?access_token=' + config.accessToken;

        Ajax
        .put(createUrl, data)
        .on('load', function (status, data) {
            callback(data.response[0]);
        });
    });
});
