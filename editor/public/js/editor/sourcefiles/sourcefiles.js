editor.once('repositories:load', function (repositories) {
    'use strict';

    var sourcefiles = new ObserverList();

    var scriptNamePattern = new RegExp("^(?:[\\w\\d\\.-]+\\\/)*[\\w\\d\\.-]+(?:\\.js(?:on)?)?$", 'i');

    // get listing of sourcefiles
    Ajax
    .get('{{url.api}}/projects/{{project.id}}/repositories/' + repositories.get('current') + '/sourcefiles?access_token=' + config.accessToken)
    .on('load', function (status, data) {
        if (data.response && data.response.length) {
            data.response.forEach(function (sourcefile) {
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
        var services = {
            directory: 'directory',
            bitbucket: 'bitbucket.org',
            github: 'github.com'
        };

        var fullUrl = [
            config.url.api,
            'projects',
            config.project.id,
            'repositories',
            repositories.get('current'),
            'sourcefiles',
            relativeUrl
        ].join('/') + '?access_token=' + config.accessToken;

        return fullUrl;
    });

    // get script content
    editor.method('sourcefiles:content', function (relativeUrl, callback) {
        var fullUrl = editor.call('sourcefiles:url', relativeUrl);

        new AjaxRequest({
            url: fullUrl,
            notJson: true
        })
        .on('load', function(status, data) {
            if (callback)
                callback(null, data);
        })
        .on('error', function (status) {
            if (callback)
                callback(status);
        });
    });

    editor.method('sourcefiles:create', function (url, callback) {
        if (repositories.get('current') !== 'directory') return;

        var data = {
            filename: url,
            content: editor.call('sourcefiles:skeleton', url)
        };

        var createUrl = [config.url.api, 'projects', config.project.id, 'repositories', repositories.get('current'), 'sourcefiles', url].join('/');
        createUrl += '?access_token=' + config.accessToken;

        Ajax
        .put(createUrl, data)
        .on('load', function (status, data) {

            var file = new Observer({
                filename: url
            });

            sourcefiles.add(file);

            editor.emit('sourcefiles:add', file);

            if (callback) {
                callback(null, file);
            }
        })
        .on('error', function (status, msg) {
            if (callback)
                callback(msg);
        });
    });

    editor.method('sourcefiles:rename', function (oldFilename, newFilename, callback) {
        if (repositories.get('current') !== 'directory') return;

        var data = {
            filename: newFilename
        };

        var renameUrl = [
            config.url.api,
            'projects',
            config.project.id,
            'repositories',
            repositories.get('current'),
            'sourcefiles',
            'rename',
            oldFilename
        ].join('/');
        renameUrl += '?access_token=' + config.accessToken;

        Ajax.put(renameUrl, data)
        .on('load', function (status, data) {
            if (callback)
                callback();
        })
        .on('error', function (err) {
            if (callback)
                callback(err);
        });
    });

    // save source file content
    editor.method('sourcefiles:save', function (content, relativeUrl, callback) {
        var saveUrl = [
            config.url.api,
            'projects',
            config.project.id,
            'repositories',
            repositories.get('current'),
            'sourcefiles',
            relativeUrl
        ].join('/');

        var data = {
            url: saveUrl,
            method: 'PUT',
            query: {
                'access_token': '{{accessToken}}'
            },
            data: {
                filename: relativeUrl,
                content: content
            },
            ignoreContentType: true,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        };

        Ajax(data)
        .on('load', function () {
            if (callback)
                callback(null);
        })
        .on('error', function (err) {
            if (callback)
                callback(err);
        });
    });

    // rename on filename set
    editor.on('sourcefiles:add', function (file) {
        var setting = false;
        file.on('filename:set', function (value, oldValue) {
            if (!editor.call('permissions:write') || setting)
                return;

            if (! value) {
                setting = true;
                file.set('filename', oldValue);
                setting = false;
                return;
            }


            if (! value.toLowerCase().endsWith('.js')) {
                value += '.js';
                setting = true;
                file.set('filename', value);
                setting = false;
            }

            if (! scriptNamePattern.test(value)) {
                setting = true;
                file.set('filename', oldValue);
                setting = false;
                setTimeout(function () {
                    editor.call('status:error', 'Invalid script name');
                });
                return;
            }

            editor.call('sourcefiles:rename', oldValue, value, function (err) {
                if (err) {
                    setting = true;
                    file.set('filename', oldValue);
                    setting = false;
                    editor.call('status:error', 'Could not rename script: ' + err);
                } else {
                    // get script and if its content is the same as the skeleton script
                    // then recreate it
                    editor.call('sourcefiles:content', value, function (err, content) {
                        var newContents = null;
                        if (!err && content === editor.call('sourcefiles:skeleton', oldValue)) {
                            newContents = editor.call('sourcefiles:skeleton', value);
                            editor.call('sourcefiles:save', newContents, value);
                        }
                    });

                }
            });

        });
    });

    editor.on('sourcefiles:remove', function (sourcefile) {
        sourcefiles.remove(sourcefile);
    });

});
