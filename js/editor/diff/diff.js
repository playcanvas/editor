import { Ajax } from '../../common/ajax.js';

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
     * Generates a new diff between 2 checkpoint ids. If one checkpoint id is null
     *
     * @param {string} srcBranchId - Source branch id
     * @param {string} srcCheckpointId - Source checkpoint id
     * @param {string} dstBranchId - Destination branch id
     * @param {string} dstCheckpointId - Destination checkpoint id
     * @param {string} histItem - Type and id (joined by dash) of the item whose history is requested
     * @param {Function} callback - Optional callback after the diff is generated.
     *   Has the following signature: (err, diff)
     */
    editor.method('diff:create', function (srcBranchId, srcCheckpointId, dstBranchId, dstCheckpointId, histItem, callback) {
        var data = {
            srcBranchId: srcBranchId,
            dstBranchId: dstBranchId
        };

        if (histItem) {
            data.vcHistItem = histItem;
        }

        if (srcCheckpointId) {
            data.srcCheckpointId = srcCheckpointId;
        }
        if (dstCheckpointId) {
            data.dstCheckpointId = dstCheckpointId;
        }

        request({
            url: '{{url.api}}/diff',
            method: 'POST',
            data: data,
            auth: true
        }, callback);
    });

    /**
     * Generates a diff between a checkpoint and the current merge.
     *
     * @param {Function} [callback] - Optional callback after the diff is generated.
     */
    editor.method('diff:merge', function (callback) {
        request({
            url: '{{url.api}}/diff',
            method: 'POST',
            data: {
                srcBranchId: config.self.branch.merge.sourceBranchId,
                dstBranchId: config.self.branch.merge.destinationBranchId,
                dstCheckpointId: config.self.branch.merge.destinationCheckpointId,
                mergeId: config.self.branch.merge.id
            },
            auth: true
        }, callback);
    });

});
