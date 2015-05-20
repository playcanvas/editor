app.once('load', function() {
    'use strict';

    var framework = app.call('viewport');


    var onLoad = function (data) {
        var i = 0;
        var l = data['response'].length;

        var filenames = data['response'].map(function (item) {
            return item.filename;
        });

        app.emit("sourcefiles:load", filenames)
    };

    // load assets
    Ajax.get("{{url.home}}{{project.repositoryUrl}}" + "?access_token={{accessToken}}")
        .on('load', function(status, data) {
            onLoad(data);
        })
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
});
