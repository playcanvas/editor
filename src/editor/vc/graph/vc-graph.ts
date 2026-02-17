editor.once('load', () => {
    /**
     * Initialize and show the Version Control graph. Assign initial
     * coordinates to each node, make sure nodes do not overlap vertically
     * (vertical consistency), and try to place branches above each other
     * when possible to save horizontal space (compact branches).
     */
    class VcGraphLogic {
        constructor(initData: Record<string, unknown>, params: { vcGraphContainer: { dom: HTMLElement }; vcGraphCloseBtn: { dom: HTMLElement }; vcNodeMenu: unknown; vcHistItem: unknown }) {
            this.initData = initData;

            this.container = params.vcGraphContainer;

            this.closeBtn = params.vcGraphCloseBtn;

            this.vcNodeMenu = params.vcNodeMenu;

            this.vcHistItem = params.vcHistItem;

            this.idToNode = {};

            this.branches = {};

            this.renderedEdges = {};

            this.fullGraph = {};
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

        handleNewData(data: Record<string, unknown>) {
            this.setVars(data);

            this.helper('vcgraph:placeVcNodes');

            this.helper('vcgraph:utils', 'handleAllCorners');

            this.helper('vcgraph:verticalConsistency');

            this.helper('vcgraph:compactBranches');

            this.helper('vcgraph:utils', 'renderAllVcNodes');

            this.helper('vcgraph:utils', 'renderAllVcEdges');
        }

        setVars(data: Record<string, unknown>) {
            this.isGraphLoading = false;

            if (this.vcHistItem) {
                this.prepForHist(data);
            }

            this.idToNode = Object.assign({}, data.idToData, this.idToNode);

            this.branches = Object.assign({}, data.branches, this.branches);

            this.helper('vcgraph:utils', 'assignBranchColors');

            this.startNode = this.idToNode[data.graphStartId] ||
                this.idToNode[this.origStartId];

            this.vcNodeMenu.hidden = true;
        }

        prepForHist(data: Record<string, unknown>) {
            if (!this.origStartId) {
                this.origStartId = data.graphStartId;
            }

            this.addToFull(data.idToData);

            const h = editor.call('vcgraph:makeHistGraph', this.fullGraph, this.origStartId);

            data.idToData = this.helper('vcgraph:syncHistGraph', h);
        }

        addToFull(h: Record<string, Record<string, unknown>>) {
            h = editor.call('template:utils', 'deepClone', h);

            Object.assign(this.fullGraph, h);
        }

        handleClick(id: string) {
            this.helper(
                'vcgraph:utils',
                'vcNodeClick',
                id,
                (err, data) => this.handleNewData(data)
            );
        }

        helper(...args: unknown[]) {
            const h = {
                graph: this.graph,
                renderedEdges: this.renderedEdges,
                idToNode: this.idToNode,
                branches: this.branches,
                startNode: this.startNode,
                vcNodeMenu: this.vcNodeMenu,
                vcHistItem: this.vcHistItem
            };

            return editor.call(...args, h);
        }
    }

    editor.method('vcgraph:showInitial', (h: unknown) => {
        editor.call('vcgraph:showNodeMenu', h.vcNodeMenu);

        editor.call('vcgraph:utils', 'backendGraphTask', h, (err, data) => {
            new VcGraphLogic(data, h).run();
        });
    });
});
