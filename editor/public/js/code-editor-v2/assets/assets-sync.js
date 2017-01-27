editor.once('load', function () {
    'use strict';

    // load editable assets
    Ajax({
        url: '{{url.api}}/projects/{{project.id}}/assets?view=codeeditor',
        auth: true
    })
    .on('load', function (status, res) {
        res.forEach(function (raw) {
            var asset = new Observer(raw);
            editor.call('assets:add', asset);
        });

        editor.call('assets:load');
        editor.call('status:clear');
    })
    .on('error', function (status, error) {
        if (error) {
            editor.call('status:error', 'Error: ' + error + '(Status: ' + status + ')');
        } else {
            editor.call('status:error', 'Error - Status ' + status);
        }
    });

    // Load asset file contents and call callback
    editor.method('assets:loadFile', function (asset, fn) {
        Ajax({
            url: '{{url.api}}/assets/' + asset.get('id') + '/file/' + asset.get('file.filename'),
            auth: true,
            notJson: true
        })
        .on('load', function(status, data) {
            fn(null, data);
        })
        .on('error', function (err) {
            fn(err);
        });
    });
});