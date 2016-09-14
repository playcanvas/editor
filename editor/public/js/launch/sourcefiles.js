app.once('load', function() {
    'use strict';

    if (! app.call('project:settings').get('use_legacy_scripts'))
        return;

    var framework = app.call('viewport');


    var onLoad = function (data) {
        var i = 0;
        var l = data.result.length;

        var filenames = data.result.map(function (item) {
            return item.filename;
        });

        app.emit("sourcefiles:load", filenames);
    };

    // load scripts
    Ajax({
        url: '{{url.home}}{{project.repositoryUrl}}',
        auth: true
    })
    .on('load', function(status, data) {
        onLoad(data);
    })
    .on('error', function(status, evt) {
        console.log(status, evt);
        app.emit("sourcefiles:load", []);
    });
});
