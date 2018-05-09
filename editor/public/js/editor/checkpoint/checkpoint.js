editor.once('load', function () {
    'use strict';

    var numItemsLimit = 20;

    editor.method('checkpoint:create', function (data) {
        Ajax({
            url: '{{url.api}}/checkpoint',
            auth: true,
            method: 'POST',
            data: data

        }).on('error', logError);
    });

    editor.method('checkpoint:restore', function (data) {
        Ajax({
            url: '{{url.api}}/checkpoint/' + data.checkpoint_id,
            auth: true,
            method: 'POST',
            data: data

        }).on('error', logError);
    });

    editor.method('checkpoint:get_latest', function (cb) {
        var url = projCheckpointUrl();

        Ajax({
            url: url,
            auth: true

        }).on('load', function (status, data) {

            cb(data);

        }).on('error', logError);
    });

    editor.method('checkpoint:get_after_checkpoint', function (id, cb) {
        var url = projCheckpointUrl() +
            '&after_checkpoint=' + id;

        Ajax({
            url: url,
            auth: true

        }).on('load', function (status, data) {

            cb(data);

        }).on('error', logError);
    });

    editor.method('checkpoint:get_before_checkpoint', function (id, cb) {
        var url = projCheckpointUrl() +
            '&before_checkpoint=' + id;

        Ajax({
            url: url,
            auth: true

        }).on('load', function (status, data) {

            cb(data);

        }).on('error', logError);
    });


    function projCheckpointUrl() {
        return '{{url.api}}/projects/{{project.id}}/checkpoint?limit=' + numItemsLimit;
    }

    function logError(status, data) {
        console.log('error', data);
    }
});