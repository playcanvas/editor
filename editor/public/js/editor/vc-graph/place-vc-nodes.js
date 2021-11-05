editor.once('load', function () {
    'use strict';

    // Set the 'coords' field of every checkpoint node. The coords
    // are set relative to the previous node of our bfs traversal
    class PlaceVcNodes {
        constructor(data) {
            this.idToNode = data.idToNode;

            this.branches = data.branches;

            this.startNode = data.startNode;

            this.q1 = [];

            this.q2 = [ this.startNode ];

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

        handleEdge(node1, edge, type) {
            const id = edge[type];

            const node2 = !this.visited[id] && this.idToNode[id];

            if (node2) {
                this.visited[id] = true;

                this.handleNeighbor(node2, node1, type);
            }
        }

        handleNeighbor(h, prev, type) {
            if (!h.coords) {
                this.setCoords(h, prev, type);
            }

            const dst = h.branchId === this.curBranch ?  this.q1 : this.q2;

            dst.push(h);
        }

        setCoords(h, prev, type) {
            const x = this.xCoordForNode(h);

            const y = prev.coords.y + (type === 'parent' ? 1 : -1);

            h.coords = { x: x, y: y };
        }

        xCoordForNode(node) {
            const h = this.branches[node.branchId];

            if (h.branchXCoord === undefined) {
                h.branchXCoord = editor.call('vcgraph:utils', 'nextBranchCoordX');
            }

            return h.branchXCoord;
        }

        prepIteration() {
            if (this.q1.length) {
                return true;

            } else if (this.q2.length) {
                this.moveTo1();

                return true;

            } else {
                return false;
            }
        }

        moveTo1() {
            const h = this.q2.shift();

            this.q1.push(h);

            this.curBranch = h.branchId;
        }
    }

    editor.method('vcgraph:placeVcNodes', function (data) {
        new PlaceVcNodes(data).run();
    });
});
