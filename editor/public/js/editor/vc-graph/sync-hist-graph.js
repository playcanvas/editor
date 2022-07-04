/**
 * After getting new data via expand node, compare the full old (rendered)
 * graph with the newly computed full history graph that includes new data.
 * Each old node that differs is removed. Then edges are added to the old
 * nodes to connect them to new nodes.
 */
editor.once('load', function () {
    'use strict';

    class SyncHistGraph {
        constructor(newGraph, data) {
            this.newGraph = newGraph;

            this.oldGraph = data.idToNode;

            this.data = data;
        }

        run() {
            this.init();

            this.oldNodes.forEach(this.handleOld, this);

            this.newNodes.forEach(this.handleNew, this);

            return this.newGraph;
        }

        init() {
            this.oldNodes = Object.values(this.oldGraph);

            this.newNodes = Object.values(this.newGraph);
        }

        handleOld(h1) {
            const h2 = this.newGraph[h1.id];

            const keep = h2 && editor.call('vcgraph:utils', 'equalHistNodes', h1, h2);

            if (!keep) {
                editor.call('vcgraph:utils', 'permRmNode', h1, this.data);
            }
        }

        handleNew(h) {
            const id = h.id;

            if (this.oldGraph[id]) {
                delete this.newGraph[id];

            } else {
                this.addEdgesToOld(h, 'parent', 'child');

                this.addEdgesToOld(h, 'child', 'parent');
            }
        }

        addEdgesToOld(h1, type1, type2) {
            h1[type1].forEach((edge) => {
                const id2 = edge[type1];

                const h2 = this.oldGraph[id2];

                h2 && this.addOneEdge(h2[type2], edge);
            });
        }

        addOneEdge(dst, edge) {
            edge = editor.call('template:utils', 'deepClone', edge);

            dst.push(edge);
        }
    }

    editor.method('vcgraph:syncHistGraph', function (newGraph, data) {
        return new SyncHistGraph(newGraph, data).run();
    });
});
