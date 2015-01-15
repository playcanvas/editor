editor.once('load', function() {
    'use strict';

    var sceneSettings = new Observer();

    // get scene settings
    editor.hook('scene-settings', function() {
        return sceneSettings;
    });

    var loaded = function (pack) {
        sceneSettings.sync = false;
        sceneSettings.history = false;

        sceneSettings.patch(pack.settings);

        sceneSettings.history = true;
        sceneSettings.sync = true;

        // sync
        sceneSettings.on('*:set', function(field, value) {
            if (!this.sync) {
                return;
            }

            var data = {
                application_data: pack.application_data,
                resource_id: pack.resource_id,
                settings: this.json()
            };

            Ajax({
                url: '{{url.api}}/{{owner.username}}/{{project.name}}/packs/{{pack.resource_id}}',
                method: 'PUT',
                query: {
                    access_token: '{{accessToken}}'
                },
                data: data
            })
            .on('error', function(status, evt) {
                console.log("error", status, evt);
            });
        });
    };

    // load pack
    editor.on('start', function() {
        Ajax({
            url: '{{url.api}}/{{owner.username}}/{{project.name}}/packs/{{pack.resource_id}}',
            query: {
                access_token: '{{accessToken}}',
                flat: 1
            }
        })
        .on('load', function(status, data) {
            loaded(data.response[0]);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });

});
