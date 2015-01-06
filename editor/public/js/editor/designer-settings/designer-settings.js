(function() {
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
        'grid_divisions': 14,
        'grid_division_size': 10,
        'snap_increment': 1
    });
    designerSettings.sync = false;

    // get designer settings
    msg.hook('designer-settings', function() {
        return designerSettings;
    });

    // sync
    designerSettings.on('*:set', function(field, value) {
        if (! this.sync)
            return;

        Ajax({
            url: '{{url.api}}/{{owner.username}}/{{project.name}}/packs/{{pack.resource_id}}/designer_settings/max',
            method: 'PUT',
            query: {
                access_token: '{{accessToken}}'
            },
            data: this.json()
        })
        // .on('load', function(status, data) {
        //     console.log(status, data);
        // })
        // .on('error', function(status, evt) {
        //     console.log("error", status, evt)
        // })
    });

    // load designer settings
    Ajax
    .get('{{url.api}}/{{owner.username}}/{{project.name}}/packs/{{pack.resource_id}}/designer_settings/max?access_token={{accessToken}}')
    .on('load', function(status, data) {
        for(var i = 0; i < designerSettings.__keys.length; i++) {
            var key = designerSettings.__keys[i];
            var value = data.response[0][key];

            if (value !== undefined)
                designerSettings.set(key, value);
        }

        designerSettings.sync = true;
    });
})();
