editor.once('load', function () {
    'use strict';

    /**
     * Initialize and show the Version Control graph. Assign initial
     * coordinates to each node, make sure nodes do not overlap vertically
     * (vertical consistency), and try to place branches above each other
     * when possible to save horizontal space (compact branches).
     */
    class VcGraphLogic {
        constructor(initData, container, closeBtn) {
            this.initData = initData;

            this.container = container;

            this.closeBtn = closeBtn;

            this.idToNode = {};

            this.branches = {};

            this.renderedEdges = {};
        }

        run() {
            this.graph = editor.call(
                'vcgraph:utils',
                'initVcGraph',
                this.container,
                this.closeBtn
            );

            this.graph.on('EVENT_SELECT_NODE', h => this.handleClick(h.node.id));

            this.handleNewData(this.initData);
        }

        handleNewData(data) {
            this.setVars(data);

            this.helper('vcgraph:placeVcNodes');

            this.helper('vcgraph:utils', 'handleAllCorners');

            this.helper('vcgraph:verticalConsistency');

            this.helper('vcgraph:compactBranches');

            this.helper('vcgraph:utils', 'renderAllVcNodes');

            this.helper('vcgraph:utils', 'renderAllVcEdges');
        }

        setVars(data) {
            this.idToNode = Object.assign({}, data.idToData, this.idToNode);

            this.branches = Object.assign({}, data.branches, this.branches);

            this.helper('vcgraph:utils', 'assignBranchColors');

            this.startNode = this.idToNode[data.graphStartId];
        }

        handleClick(id) {
            const node = this.idToNode[id];

            const screenCoords = editor.call(
                'vcgraph:utils',
                'nodeToScreenCoords',
                node,
                this.graph
            );

            editor.call(
                'vcgraph:showNodeMenu',
                node,
                screenCoords,
                (err, data) => this.handleNewData(data)
            );
        }

        helper(method1, method2) {
            const h = {
                graph: this.graph,
                renderedEdges: this.renderedEdges,
                idToNode: this.idToNode,
                branches: this.branches,
                startNode: this.startNode
            };

            return method2 ?
                editor.call(method1, method2, h) :
                editor.call(method1, h);
        }
    }

    editor.method('vcgraph:showInitial', function (branchId, container, closeBtn) {
        const params = {
            branch: branchId,
            task_type: 'vc_graph_for_branch'
        };

        editor.call('checkpoints:list', params, (err, data) => {
            new VcGraphLogic(data, container, closeBtn).run();
        });
    });
});
