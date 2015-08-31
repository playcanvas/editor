editor.once('load', function() {
    'use strict';

    var designerSettings = new Observer({
        'camera_near_clip': 0.1,
        'camera_far_clip': 1000,
        'camera_clear_color': [
            0.729411780834198,
            0.729411780834198,
            0.6941176652908325,
            1
        ],
        'grid_divisions': 8,
        'grid_division_size': 1,
        'snap_increment': 1,
        'icons_size': .2,
        'local_server': 'http://localhost:51000'
    });
    designerSettings.sync = false;

    // get designer settings
    editor.method('designerSettings', function() {
        return designerSettings;
    });

    var syncTimeout;

    // sync
    designerSettings.on('*:set', function(field, value) {
        if (! this.sync)
            return;

        if (syncTimeout)
            clearTimeout(syncTimeout);

        syncTimeout = setTimeout(function () {
            Ajax({
                url: '{{url.api}}/scenes/{{scene.id}}/designer_settings/{{self.id}}',
                method: 'PUT',
                query: {
                    access_token: '{{accessToken}}'
                },
                data: this.json()
            });
            syncTimeout = null;
        }.bind(this), 100);
    });

    // load designer settings
    var loadSettings = function () {
        Ajax
        .get('{{url.api}}/scenes/{{scene.id}}/designer_settings/{{self.id}}?access_token={{accessToken}}')
        .on('load', function(status, data) {
            designerSettings.history = false;

            for(var i = 0; i < designerSettings._keys.length; i++) {
                var key = designerSettings._keys[i];
                var value = data.response[0][key];

                if (value !== undefined)
                    designerSettings.set(key, value);
            }

            designerSettings.history = true;
            designerSettings.sync = true;
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
