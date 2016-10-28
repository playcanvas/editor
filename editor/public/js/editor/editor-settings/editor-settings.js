editor.once('load', function() {
    'use strict';

    var editorSettings = new Observer({
        'camera_near_clip': 0.1,
        'camera_far_clip': 1000,
        'camera_clear_color': [
            0.118,
            0.118,
            0.118,
            1
        ],
        'grid_divisions': 8,
        'grid_division_size': 1,
        'snap_increment': 1,
        'icons_size': .2,
        'local_server': 'http://localhost:51000',
        'help': true
    });
    editorSettings.sync = false;

    // get editor settings
    editor.method('editorSettings', function() {
        return editorSettings;
    });

    var syncTimeout;

    // sync
    editorSettings.on('*:set', function(field, value) {
        if (! this.sync)
            return;

        if (syncTimeout)
            clearTimeout(syncTimeout);

        syncTimeout = setTimeout(function () {
            Ajax({
                url: '{{url.api}}/scenes/{{scene.id}}/designer_settings/{{self.id}}',
                method: 'PUT',
                auth: true,
                data: this.json()
            });
            syncTimeout = null;
        }.bind(this), 100);
    });

    // load editor settings
    var loadSettings = function () {
        Ajax({
            url: '{{url.api}}/scenes/{{scene.id}}/designer_settings/{{self.id}}',
            auth: true
        })
        .on('load', function(status, data) {
            editorSettings.history = false;

            for(var i = 0; i < editorSettings._keys.length; i++) {
                var key = editorSettings._keys[i];
                var value = data[key];

                if (value !== undefined)
                    editorSettings.set(key, value);
            }

            editorSettings.history = true;
            editorSettings.sync = true;

            editor.emit('editorSettings:load');
        });
    };

    // if we already have a scene id then load settings otherwise
    // wait for a scene id to be loaded and then load settings
    if (config.scene.id) {
        loadSettings();
        // wait for first scene:raw to pass then register on scene:raw to reload settings
        editor.once('scene:raw', function () {
            editor.on('scene:raw', loadSettings);
        });
    } else  {
        editor.on('scene:raw', loadSettings);
    }
});
