editor.once('load', function () {
    'use strict';

    const expandNode = function (node, callback) {
        const params = {
            branch: node.branchId,
            graphStartId: node.id,
            task_type: 'vc_graph_for_branch'
        };

        editor.call('checkpoints:list', params, callback);
    }

    // screenCoords has top left corner of the box, its width and height
    editor.method('vcgraph:showNodeMenu', function (node, screenCoords, expandCallback) {
        expandNode(node, expandCallback);
    });
});
