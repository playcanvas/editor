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

    // Load project branches
    // args.limit: the limit
    // args.skip: the number of entries to skip
    // args.closed: If true only return closed branches
    /**
     * Generates a new diff from the current state to the latest
     * checkpoint.
     * @param {Function} [callback] Optional callback after the diff is generated.
     * Has the following signature: (err, diff)
     */
    editor.method('diff:create', function (callback) {
        request({
            url: '{{url.api}}/diff',
            method: 'POST',
            data: {
                dstCheckpointId: config.self.branch.latestCheckpointId
            },
            auth: true
        }, callback);
    });

});
