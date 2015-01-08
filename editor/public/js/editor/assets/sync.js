(function() {
    'use strict'

    // loaded all assets
    var onLoad = function(data) {
        msg.call('assets:progress', .5);

        data = data.response;

        for(var i = 0; i < data.length; i++) {
            if (data[i].source)
                continue;

            // TODO
            // this is workaround to convert from array to key-value material properties
            if (data[i].type == 'material') {
                data[i].data = msg.call('material:listToMap', data[i].data);
            }

            var asset = new Observer(data[i]);

            msg.call('assets:add', asset);
            msg.call('assets:progress', (i / data.length) * .5 + .5);
        }

        msg.call('assets:progress', 1);
    };

    // load all assets
    msg.once('load', function() {
        Ajax
        .get('{{url.api}}/projects/{{project.id}}/assets?view=designer&access_token={{accessToken}}')
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('progress', function(progress) {
            msg.call('assets:progress', .1 + progress * .4);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    })

    msg.call('assets:progress', .1);


    // hook sync to new assets
    msg.on('assets:add', function(asset) {
        asset.sync = true;

        var updating = false;

        var update = function() {
            var json = asset.json();

            if (json.type === 'material') {
                json.data = msg.call('material:mapToList', json);
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
            })
            // .on('load', function(status, data) {
            //     // data = data.response[0];
            //     // if (data.type == 'material') {
            //     //     data.data = msg.call('material:listToMap', data.data);
            //     // }
            //     // asset.sync = false;
            //     // asset.patch(data);
            //     // asset.sync = true;
            // })
            // .on('error', function(err) {
            //     console.log(err);
            // });

            updating = false;
        };

        asset.on('*:set', function(path) {
            if (! asset.sync || updating)
                return;

            if (path !== 'name' && path.indexOf('data.') !== 0)
                return;

            updating = true;
            setTimeout(function() {
                update();
            }, 50);
        });
    });
})();
