editor.once('load', function() {
    'use strict';

    var sceneSettings = new Observer();

    // get scene settings
    editor.method('sceneSettings', function() {
        return sceneSettings;
    });

    var loaded = function (settings) {
        sceneSettings.sync = false;
        sceneSettings.history = false;

        sceneSettings.patch(settings);

        sceneSettings.history = true;
        sceneSettings.sync = true;

        // sync
        sceneSettings.on('*:set', function(field, value) {
            if (! this.sync)
                return;

            // var data = {
            //     application_data: scene.application_data,
            //     resource_id: scene.resource_id,
            //     settings: this.json()
            // };

            // TODO
            // sharejs update

            // Ajax({
            //     url: '{{url.api}}/scenes/{{scene.id}}',
            //     method: 'PUT',
            //     query: {
            //         access_token: '{{accessToken}}'
            //     },
            //     data: data
            // })
            // .on('error', function(status, evt) {
            //     console.log("error", status, evt);
            // });
        });
    };

    editor.on('realtime:load', function(doc) {
        loaded(doc.snapshot.settings);
    });

    // // load scene
    // editor.on('start', function() {
    //     Ajax({
    //         url: '{{url.api}}/scenes/{{scene.id}}',
    //         query: {
    //             access_token: '{{accessToken}}',
    //             flat: 1
    //         }
    //     })
    //     .on('load', function(status, data) {
    //         loaded(data.response[0]);
    //     })
    //     .on('error', function(status, evt) {
    //         console.log(status, evt);
    //     });
    // });

});
