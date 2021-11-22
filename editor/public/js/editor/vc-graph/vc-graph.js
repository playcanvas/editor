editor.once('load', function () {
    'use strict';

    /**
     * Initialize and show the Version Control graph. Assign initial
     * coordinates to each node, make sure nodes do not overlap vertically
     * (vertical consistency), and try to place branches above each other
     * when possible to save horizontal space (compact branches).
     */
    class VcGraphLogic {
        constructor(initData, params) {
            this.initData = initData;

            this.container = params.vcGraphContainer;

            this.closeBtn = params.vcGraphCloseBtn;

            this.vcNodeMenu = params.vcNodeMenu;

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

            this.isGraphLoading = false;

            this.vcNodeMenu.hidden = true;
        }

        handleClick(id) {
            this.helper(
                'vcgraph:utils',
                'vcNodeClick',
                id,
                (err, data) => this.handleNewData(data)
            );
        }

        helper(...args) {
            const h = {
                graph: this.graph,
                renderedEdges: this.renderedEdges,
                idToNode: this.idToNode,
                branches: this.branches,
                startNode: this.startNode,
                vcNodeMenu: this.vcNodeMenu
            };

            editor.call(...args, h);
        }
    }

    editor.method('vcgraph:showInitial', function (params) {
        const h = { branch: params.branchId };

        editor.call('vcgraph:showNodeMenu', params.vcNodeMenu);

        editor.call('vcgraph:utils', 'backendGraphTask', h, (err, data) => {
            new VcGraphLogic(data, params).run();
        });
    });
});
