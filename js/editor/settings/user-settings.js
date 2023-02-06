editor.once('load', function () {
    var editorData = {
        howdoi: true,
        iconSize: 0.2,
        showSkeleton: true,
        zoomSensitivity: 7.5,
        cameraGrabColor: true,
        cameraGrabDepth: true
    };

    var settings = editor.call('settings:create', {
        name: 'user',
        id: 'user_' + config.self.id,
        data: {
            editor: editorData
        }
    });

    // add history
    settings.history = new ObserverHistory({
        item: settings,
        history: editor.call('editor:history')
    });

    // migrations
    editor.on('settings:user:load', function () {
        setTimeout(function () {
            var history = settings.history.enabled;
            settings.history.enabled = false;

            if (!settings.has('editor.showSkeleton'))
                settings.set('editor.showSkeleton', true);

            if (!settings.get('editor.zoomSensitivity'))
                settings.set('editor.zoomSensitivity', 7.5);

            settings.history.enabled = history;
        });
    });
});
