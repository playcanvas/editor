editor.once('load', function () {
    var def = {};

    var data = {
        url: config.url.autocomplete,
        method: 'GET'
    };

    Ajax(data)
    .on('load', function (status, data) {
        def = data;
        editor.emit('tern:load');
    })
    .on('error', function (status, data) {
        editor.emit('tern:error', status);
    });

    editor.method('tern-pc', function () {
        return def;
    });
});
