editor.once('load', function() {
    'use strict';

    editor.method('assets:createMaterial', function () {
        var data = editor.call('material:mapToList', {
            name: 'New Material',
            data: {
                model: 'phong'
            }
        });

        var asset = {
            name: 'New Material',
            type: 'material',
            source: false,
            data: data,
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        Ajax
        .post('{{url.api}}/assets?access_token={{accessToken}}', asset)
        .on('error', function(status, evt) {
            console.log(status, evt);
        });
    });
});
