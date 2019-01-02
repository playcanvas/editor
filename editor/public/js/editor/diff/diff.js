editor.once('load', function () {

    // Make ajax request
    var request = function (args, callback) {
        Ajax(args)
        .on('error', function (status, err) {
            if (callback) callback(err);
        })
        .on('load', function (status, data) {
            if (callback) callback(null, data);
        });
    };

    /**
     * Generates a new diff from the current state to the specified checkpoint id
     * @param {Function} [callback] Optional callback after the diff is generated.
     * Has the following signature: (err, diff)
     */
    editor.method('diff:create', function (checkpointId, callback) {
        request({
            url: '{{url.api}}/diff',
            method: 'POST',
            data: {
                dstCheckpointId: checkpointId
            },
            auth: true
        }, callback);
    });

});
