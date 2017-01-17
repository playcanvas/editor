
editor.once('load', function() {
    'use strict';

    var projectSettings = editor.call('project:settings');

    editor.on('realtime:authenticated', function () {
        if (! projectSettings.has('vr')) {
            projectSettings.set('vr', false);
        }
    });
});
