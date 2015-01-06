(function() {
    'use strict'

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

    msg.call('assets:progress', .1);
})();
