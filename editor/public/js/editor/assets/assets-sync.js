editor.once('load', function() {
    'use strict';

    // loaded all assets
    var onLoad = function(data) {
        editor.call('assets:progress', .5);

        data = data.response;

        for(var i = 0; i < data.length; i++) {
            if (data[i].source)
                continue;

            // TODO
            // this is workaround to convert from array to key-value material properties
            if (data[i].type == 'material') {
                data[i].data = editor.call('material:listToMap', data[i].data);
            }

            var asset = new Observer(data[i]);

            editor.call('assets:add', asset);
            editor.call('assets:progress', (i / data.length) * .5 + .5);
        }

        editor.call('assets:progress', 1);
        editor.emit('assets:load');
    };

    // load all assets
    editor.once('start', function() {
        Ajax
        .get('{{url.api}}/projects/{{project.id}}/assets?view=designer&access_token={{accessToken}}')
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('progress', function(progress) {
            editor.call('assets:progress', .1 + progress * .4);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });

    editor.call('assets:progress', .1);

    // method to create asset
    editor.method('assets:create', function (data) {
        Ajax
        .post('{{url.api}}/assets?access_token={{accessToken}}', data)
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });

    // hook sync to new assets
    editor.on('assets:add', function(asset) {
        asset.sync = true;
        asset.syncing = false;

        var update = function() {
            var json = asset.json();

            if (json.type === 'material') {
                json.data = editor.call('material:mapToList', json);
            }

            // TEMP
            // scope to update!?
            json.scope = {
                type: 'project',
                id: config.project.id
            };

            Ajax({
                method: 'PUT',
                url: '{{url.api}}/assets/' + asset.id,
                query: {
                    access_token: '{{accessToken}}'
                },
                data: json
            });
            // TODO
            // do we update with data from response?

            asset.syncing = false;
        };

        asset.on('*:set', function(path) {
            if (! asset.sync || asset.syncing)
                return;

            if (path !== 'name' && path.indexOf('data.') !== 0)
                return;

            // loading in progress - cancel
            if (asset.loadAjax) {
                asset.loadAjax.abort();
                asset.loadAjax = null;
            }

            asset.syncing = true;
            asset.syncTimeout = setTimeout(update, 50);
        });
    });
});
