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

        for (var key in pack.settings) {
            if (pack.settings.hasOwnProperty(key)) {
                sceneSettings.set(key, pack.settings[key]);
            }
        }

        sceneSettings.history = true;
        sceneSettings.sync = true;

        // unflatten pack hierarchy for now because otherwise the pack
        // cannot be saved
        pack.hierarchy = unflatten(pack.hierarchy[pack.resource_id], pack.hierarchy);

        // sync
        sceneSettings.on('*:set', function(field, value) {
            if (!this.sync) {
                return;
            }

            var data = {
                application_data: pack.application_data,
                resource_id: pack.resource_id,
                hierarchy: pack.hierarchy,
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

    // Convert a root entity and list of all entities into a hierarchy
    var unflatten = function (entity, entities) {
        var i, len = entity.children.length;
        var children = [];

        for (i = 0; i < len; i++) {
            children.push(entities[entity.children[i]]);
            unflatten(entities[entity.children[i]], entities);
        }

        entity.children = children;

        return entity;
    };
});
