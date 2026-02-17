editor.once('load', () => {
    // Set the 'coords' field of every checkpoint node. The coords
    // are set relative to the previous node of our bfs traversal
    class PlaceVcNodes {
        constructor(data: { idToNode: Record<string, Record<string, unknown>>; branches: Record<string, Record<string, unknown>>; startNode: Record<string, unknown> }) {
            this.idToNode = data.idToNode;

            this.branches = data.branches;

            this.startNode = data.startNode;

            this.q1 = [];

            this.q2 = [this.startNode];

            this.visited = {};
        }

        run() {
            this.setStartCoords();

            while (this.prepIteration()) {
                const h = this.q1.shift();

                editor.call('vcgraph:utils', 'iterAllEdges', h, this.handleEdge.bind(this));
            }
        }

        setStartCoords() {
            if (!this.startNode.coords) {
                const x = this.xCoordForNode(this.startNode);

                this.startNode.coords = {
                    x: x,
                    y: 0
                };
            }
        }

        handleEdge(node1: Record<string, unknown>, edge: Record<string, unknown>, type: 'parent' | 'child') {
            const id = edge[type];

            const node2 = !this.visited[id] && this.idToNode[id];

            if (node2) {
                this.visited[id] = true;

                this.handleNeighbor(node2, node1, type);
            }
        }

        handleNeighbor(h: Record<string, unknown>, prev: Record<string, unknown>, type: 'parent' | 'child') {
            if (!h.coords) {
                this.setCoords(h, prev, type);
            }

            const dst = h.branchId === this.curBranch ? this.q1 : this.q2;

            dst.push(h);
        }

        setCoords(h: Record<string, unknown>, prev: Record<string, unknown>, type: 'parent' | 'child') {
            const x = this.xCoordForNode(h);

            const y = prev.coords.y + (type === 'parent' ? 1 : -1);

            h.coords = { x: x, y: y };
        }

        xCoordForNode(node: Record<string, unknown>) {
            const h = this.branches[node.branchId];

            if (h.branchXCoord === undefined) {
                h.branchXCoord = editor.call('vcgraph:utils', 'nextBranchCoordX');
            }

            return h.branchXCoord;
        }

        prepIteration() {
            if (this.q1.length) {
                return true;

            }
            if (this.q2.length) {
                this.moveTo1();

                return true;

            }
            return false;

        }

        moveTo1() {
            const h = this.q2.shift();

            this.q1.push(h);

            this.curBranch = h.branchId;
        }
    }

    editor.method('vcgraph:placeVcNodes', (data: unknown) => {
        new PlaceVcNodes(data).run();
    });
});
