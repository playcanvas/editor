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

    // create asset
    editor.method('assets:create', function (data) {
        var evtAssetAdd = editor.once('assets:add', function(asset) {
            evtAssetAdd = null;
            editor.call('selector:set', 'asset', [ asset ]);
        });

        editor.once('selector:change', function() {
            if (evtAssetAdd)
                evtAssetAdd.unbind();
        });

        Ajax
        .post('{{url.api}}/assets?access_token={{accessToken}}', data)
        .on('error', function(status, evt) {
            if (evtAssetAdd)
                evtAssetAdd.unbind();

            console.log(status, evt);
        });
    });

    // delete asset
    editor.method('assets:delete', function(asset) {
        if (asset.get('type') === 'script') {
            editor.emit('sourcefiles:remove', asset);

            Ajax
            .delete('{{url.api}}/projects/' + config.project.id + '/repositories/directory/sourcefiles/' + asset.get('filename') + '?access_token={{accessToken}}');
        } else {
            editor.call('assets:remove', asset);

            Ajax
            .delete('{{url.api}}/assets/' + asset.get('id') + '?access_token={{accessToken}}')
            .on('error', function(status, evt) {
                console.log(status, evt);
            });
        }
    });

    // hook sync to new assets
    editor.on('assets:add', function(asset) {
        asset.sync = true;
        asset.syncing = false;

        var update = function() {
            var json = asset.json();

            // make sure we don't send thumbnails
            delete json['thumbnails'];

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
                url: '{{url.api}}/assets/' + asset.get('id'),
                query: {
                    access_token: '{{accessToken}}'
                },
                data: json
            });
            // TODO
            // do we update with data from response?

            asset.syncing = false;
        };

        var updateRegex = new RegExp(/^(name$|preload$)|(data\.)|(file$)/);

        asset.on('*:set', function(path) {
            if (! asset.sync || asset.syncing)
                return;

            if (! updateRegex.test(path))
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
