editor.once('load', function() {
    'use strict';

    var sceneSettings = editor.call('sceneSettings');

    var timeout;

    function updateSettings () {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(function () {
            var framework = editor.call('viewport:framework');
            if (framework) {
                framework._linkUpdatePackSettings(sceneSettings);
                framework.redraw = true;
            }

            timeout = null;
        }, 25);
    }

    sceneSettings.on('*:set', updateSettings);

});
