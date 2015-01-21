editor.on('load', function() {
    var hierarchyOverlay = new ui.Panel();
    hierarchyOverlay.class.add('overlay');
    editor.call('layout.left').append(hierarchyOverlay);

    var p = new ui.Progress();
    p.on('progress:100', function() {
        hierarchyOverlay.hidden = true;
    });
    hierarchyOverlay.append(p);


    var loaded = function(data) {
        p.progress = 0.6;

        var start = Date.now();

        // list
        var total = Object.keys(data).length;
        var i = 0;
        for(var key in data) {
            editor.call('entities:add', new Observer(data[key]))
            p.progress = (++i / total) * 0.4 + 0.6;
        }

        console.log('entities loaded ' + (Date.now() - start));

        p.progress = 1;
    };


    editor.on('start', function() {
        Ajax({
            url: '{{url.api}}/scenes/{{scene.id}}',
            query: {
                access_token: '{{accessToken}}',
                flat: 1
            }
        })
        .on('load', function(status, data) {
            loaded(data.response[0].hierarchy);
        })
        .on('progress', function(progress) {
            p.progress = 0.1 + progress * .4;
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });


    p.progress = 0.1;

    editor.call('attributes:clear');
});
