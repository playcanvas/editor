/**
 * Given a full VC graph to which change-related data
 * for the item at hand has been added by the backend,
 * create a new graph with nodes and edges
 * not representing any changes removed.
 *
 * We traverse the full graph from the start node and
 * mark nodes that should be included in the result.
 * We then remove the rest of the nodes, connecting
 * their neighbors as appropriate.
 *
 * We also save the id of the original parent at each
 * node to be able to show a full commit later.
 *
 * The full graph is retrieved by the backend by
 * traversing only edges from child to parent, therefore
 * the edges to child neighbors not in the graph are
 * removed by 'rmExternalChildren'. This helps correctly
 * identify nodes which are expandable for the purposes
 * of item history.
 */
editor.once('load', function () {
    'use strict';

    class MakeHistGraph {
        constructor(fullGraph, startId) {
            this.fullGraph = fullGraph;

            this.startId = startId;

            this.visited = {};

            this.keepBranches = {};

            this.includeInRes = {};

            this.histParents = {};
        }

        run() {
            this.init();

            this.resNodes.forEach(this.rmExternalChildren, this);

            this.handleCheckpoint(this.startCh);

            this.resNodes.forEach(this.rmByBranch, this);

            this.resNodes.forEach(this.rmExcluded, this);

            this.resNodes.forEach(this.addHistParent, this);

            return this.resGraph;
        }

        init() {
            this.resGraph = editor.call('template:utils', 'deepClone', this.fullGraph);

            this.resNodes = Object.values(this.resGraph);

            this.startCh = this.resGraph[this.startId];

            this.includeInRes[this.startId] = true;

            this.visited[this.startId] = true;
        }

        handleCheckpoint(h) {
            this.keepBranches[h.branchId] = true;

            const logic = this.makeLogic(h.histGraphData);

            this.handleLogic(logic, h);
        }

        makeLogic(h) {
            if (h.vcNoHistData) {
                return {};

            } else if (!h.vcAction) {
                return {
                    dontInclude: true,
                    recursion: { sameBranch: true }
                };

            } else if (h.vcAction === 'removed') {
                return { recursion: { sameBranch: true } };

            } else if (h.vcAction === 'added') {
                return { recursion: { otherBranch: true } };

            } else {
                return {
                    recursion: {
                        sameBranch: true,
                        otherBranch: true
                    }
                };
            }
        }

        handleLogic(logic, h) {
            if (!logic.dontInclude) {
                this.includeInRes[h.id] = true;
            }

            const parents = this.handleParents(h);

            this.recursCall('sameBranch', parents, logic);

            this.recursCall('otherBranch', parents, logic)
        }

        recursCall(type, parents, logic) {
            const h = logic.recursion && logic.recursion[type] && parents[type];

            const need = h && !this.visited[h.id];

            if (need) {
                this.visited[h.id] = true;

                this.handleCheckpoint(h);
            }
        }

        handleParents(h) {
            const res = {};

            h.parent.forEach(e => {
                const k = e.branch_id === h.branchId ? 'sameBranch' : 'otherBranch';

                res[k] = this.resGraph[e.parent];
            });

            this.histParents[h.id] = res.sameBranch;

            return res;
        }

        rmByBranch(h) {
            if (!this.keepBranches[h.branchId]) {
                this.rmNode(h);
            }
        }

        rmExcluded(h) {
            const bId = h.branchId;

            const h1 = this.singleNeighbor(h, 'parent');

            const h2 = this.singleNeighbor(h, 'child');

            const parentOk = (h1 && h1.branchId === bId) ||
                !h.parent.length; // first ch of project

            const childOk = h2 && h2.branchId === bId;

            const needRm = this.keepBranches[h.branchId] &&
                !this.includeInRes[h.id] &&
                parentOk && childOk;

            const needEdge = needRm && h1;

            if (needRm) {
                this.rmNode(h);
            }

            if (needEdge) {
                this.addEdge(h1.child, h1.id, h2.id, bId);

                this.addEdge(h2.parent, h1.id, h2.id, bId);
            }
        }

        singleNeighbor(h, type) {
            const edges = h[type];

            const id = edges.length === 1 && edges[0][type];

            return id && this.resGraph[id];
        }

        rmNode(h) {
            delete this.resGraph[h.id];

            this.rmAllEdges(h, 'parent', 'child');

            this.rmAllEdges(h, 'child', 'parent');
        }

        rmAllEdges(h1, type1, type2) {
            h1[type1].forEach(edge => {
                const h2 = this.resGraph[edge[type1]];

                h2 && this.rmEdge(h2, type2, h1.id);
            });
        }

        rmEdge(h, type, id) {
            h[type] = h[type].filter(edge => {
                return edge[type] !== id;
            });
        }

        addEdge(dst, parent, child, branch_id) {
            const edge = {
                parent,
                child,
                branch_id
            };

            dst.push(edge);
        }

        addHistParent(h) {
            h.histParentNode = this.histParents[h.id];
        }

        rmExternalChildren(h) {
            h.child = h.child.filter(edge => {
                return this.fullGraph[edge.child];
            });
        }
    }

    editor.method('vcgraph:makeHistGraph', function (fullGraph, startId) {
        return new MakeHistGraph(fullGraph, startId).run();
    });
});
