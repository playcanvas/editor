import type { Container, Menu } from '@playcanvas/pcui';
import type Graph from '@playcanvas/pcui-graph';

editor.once('load', () => {
    const graphCache: Record<string, { data?: Record<string, unknown>; promise?: Promise<Record<string, unknown>> }> =
        {};

    const cacheKey = (h: Record<string, unknown>) =>
        [h.branchId || h.branch, h.graphStartId || '', h.vcHistItem || ''].join(':');

    const clone = (data: Record<string, unknown>) => editor.call('template:utils', 'deepClone', data);

    const clearCache = () => {
        Object.keys(graphCache).forEach((key) => delete graphCache[key]);
    };

    /**
     * Initialize and show the Version Control graph. Assign initial
     * coordinates to each node, make sure nodes do not overlap vertically
     * (vertical consistency), and try to place branches above each other
     * when possible to save horizontal space (compact branches).
     */
    class VcGraphLogic {
        initData: Record<string, unknown>;

        container: Container;

        vcNodeMenu: Menu;

        vcHistItem: unknown;

        idToNode: Record<string, Record<string, unknown>> = {};

        branches: Record<string, Record<string, unknown>> = {};

        renderedEdges: Record<string, boolean> = {};

        fullGraph: Record<string, Record<string, unknown>> = {};

        graph!: Graph;

        isGraphLoading = false;

        startNode!: Record<string, unknown>;

        origStartId?: string;

        constructor(
            initData: Record<string, unknown>,
            params: { vcGraphContainer: Container; vcNodeMenu: Menu; vcHistItem: unknown }
        ) {
            this.initData = initData;
            this.container = params.vcGraphContainer;
            this.vcNodeMenu = params.vcNodeMenu;
            this.vcHistItem = params.vcHistItem;
        }

        run() {
            this.graph = editor.call('vcgraph:utils', 'initVcGraph', this.container);

            this.graph.on('EVENT_SELECT_NODE', (h) => this.handleClick(h.node.id));

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

            this.helper('vcgraph:utils', 'renderBranchLegend');

            this.helper('vcgraph:utils', 'renderCompareTray');
        }

        setVars(data: Record<string, unknown>) {
            this.isGraphLoading = false;

            if (this.vcHistItem) {
                this.prepForHist(data);
            }

            this.idToNode = Object.assign({}, data.idToData, this.idToNode);

            this.branches = Object.assign({}, data.branches, this.branches);

            this.helper('vcgraph:utils', 'assignBranchColors');

            this.startNode = this.idToNode[data.graphStartId] || this.idToNode[this.origStartId];

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
            this.helper('vcgraph:utils', 'vcNodeClick', id, (err, data) => this.handleNewData(data));
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

    editor.method('vcgraph:showInitial', (h: any) => {
        h.vcNodeMenu.hidden = true;
        const key = cacheKey(h);
        const cached = graphCache[key];

        // skeleton placeholder while the backend graph task runs (replaces the old loading menu box)
        const skeleton = document.createElement('div');
        skeleton.className = 'vc-graph-skeleton';
        skeleton.innerHTML = (
            '<div class="vc-graph-skeleton-node">' +
            '<span class="avatar"></span><span class="title"></span><span class="hash"></span>' +
            '<span class="line user"></span><span class="line date"></span>' +
            '</div>'
        ).repeat(4);
        if (!cached?.data) {
            h.vcGraphContainer.dom.appendChild(skeleton);
        }

        const show = (data: Record<string, unknown>) => {
            skeleton.remove();
            if (!h.vcGraphContainer.dom.isConnected) {
                return;
            }
            new VcGraphLogic(clone(data), h).run();
        };

        if (cached?.data) {
            show(cached.data);
            return;
        }

        const entry = cached || (graphCache[key] = {});
        entry.promise =
            entry.promise ||
            new Promise((resolve, reject) => {
                editor.call('vcgraph:utils', 'backendGraphTask', h, (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(data);
                });
            });
        entry.promise
            .then((data) => {
                entry.data = clone(data);
                delete entry.promise;
                show(data);
            })
            .catch((err) => {
                delete graphCache[key];
                skeleton.remove();
                log.error(err);
            });
    });

    editor.on('messenger:checkpoint.createEnded', clearCache);
    editor.on('messenger:checkpoint.hardResetEnded', clearCache);
    editor.on('messenger:checkpoint.revertEnded', clearCache);
    editor.on('messenger:branch.createEnded', clearCache);
    editor.on('messenger:branch.close', clearCache);
    editor.on('messenger:branch.delete', clearCache);
    editor.on('messenger:branch.open', clearCache);
});
