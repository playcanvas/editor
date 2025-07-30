import { Observer, ObserverList } from '@playcanvas/observer';

editor.once('repositories:load', (repositories) => {
    if (!editor.call('settings:project').get('useLegacyScripts')) {
        return;
    }

    const sourcefiles = new ObserverList();

    // get listing of sourcefiles
    editor.api.globals.rest.projects.projectRepoSourcefilesList(repositories.get('current'))
    .on('load', (status, data) => {
        if (data.result && data.result.length) {
            data.result.forEach((sourcefile) => {
                const observer = new Observer(sourcefile);
                sourcefiles.add(observer);
                editor.emit('sourcefiles:add', observer);
            });
        }

        editor.emit('sourcefiles:load', sourcefiles);
    });

    editor.method('sourcefiles:list', () => {
        return sourcefiles.array();
    });

    editor.method('sourcefiles:get', (filename) => {
        const entry = sourcefiles.findOne((file) => {
            return file.get('filename') === filename;
        });

        return entry ? entry[1] : null;
    });

    // get script full URL
    editor.method('sourcefiles:url', (relativeUrl) => {
        const fullUrl = [
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
    editor.method('sourcefiles:content', (relativeUrl, callback) => {
        editor.api.globals.rest.projects.projectRepoSourcefile(repositories.get('current'), relativeUrl)
        .on('load', (status, data) => {
            if (callback) {
                callback(null, data);
            }
        })
        .on('error', (status) => {
            if (callback) {
                callback(status);
            }
        });
    });

    editor.on('sourcefiles:remove', (sourcefile) => {
        sourcefiles.remove(sourcefile);
    });

});
