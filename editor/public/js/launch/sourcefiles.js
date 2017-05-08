editor.once('load', function() {
    'use strict';

    if (! editor.call('project:settings').get('use_legacy_scripts'))
        return;


    var onLoad = function (data) {
        var i = 0;
        var l = data.result.length;

        var filenames = data.result.map(function (item) {
            return item.filename;
        });

        editor.emit("sourcefiles:load", filenames);
    };

    // load scripts
    Ajax({
        url: '{{url.home}}{{project.repositoryUrl}}',
        cookies: true,
        auth: true
    })
    .on('load', function(status, data) {
        onLoad(data);
    })
    .on('error', function(status, evt) {
        console.log(status, evt);
        editor.emit("sourcefiles:load", []);
    });
});
