editor.once('load', function () {
    'use strict';

    const COORD_OFFSETS = { x: 80, y: 50 };

    const COORD_COEFS = { x: 265, y: 110 };

    const GRAPH_DEFAULTS = {
        passiveUIEvents: false,
        includeFonts: false,
        useGlobalPCUI: true,
        defaultStyles: {
            initialScale: 0.675,
            background: {
                color: '#20292B',
                gridSize: 1
            },
            edge: {
                connectionStyle: 'default',
                targetMarker: true,
                sourceMarker: true
            }
        },
        readOnly: true
    };

    const NODE_DEFAULTS = {
        textColor: '#20292b',
        baseHeight: 72,
        baseWidth: 190,
        lineHeight: 15,
        textAlignMiddle: true,
        includeIcon: false
    };

    const SELECTED_MARK = {
        id: 'selected_node_mark',
        type: 0,
        defaults: {
            baseHeight: 30,
            baseWidth: 30,
            includeIcon: false
        },
        offset: {
            x: 0.65,
            y: -0.1
        }
    };

    const EDGE_DEFAULTS = {
        strokeWidth: 3,
        connectionStyle: 'smoothInOut'
    };

    const SCREEN_COORD_OFFSET = { x: 80, y: 180 };

    const MIN_BETWEEN_NODES = {
        large: 2,
        small: 1
    };

    const VC_EDGE_TYPES = [ 'parent', 'child' ];

    const DESCRIPTION_LINES = 2;

    const CHARS_PER_LINE = 27;

    const TRUNCATE_TOKEN_LIMIT = 7;

    const NUM_ID_CHARS = 4;

    const CLOSED_BRANCH_SUFFIX = ' [x]';

    const VcUtils = {
        renderVcNode: function (h, data) {
            h.isNodeRendered ?
                VcUtils.updateRenderedPosition(h, data) :
                VcUtils.renderNewNode(h, data);

            h.hasNewCoords = false;
        },

        updateRenderedPosition: function (h, data) {
            if (h.hasNewCoords) {
                data.graph.updateNodePosition(h.id, {
                    x: VcUtils.transformCoord(h, 'x'),
                    y: VcUtils.transformCoord(h, 'y')
                });
            }
        },

        renderNewNode: function (h, data) {
            data.graph.createNode({
                id: h.id,
                name: VcUtils.vcNodeText(h, data),
                nodeType: VcUtils.nodeToColorType(h, data),
                posX: VcUtils.transformCoord(h, 'x'),
                posY: VcUtils.transformCoord(h, 'y'),
                marker: h.isExpandable
            });

            h.isNodeRendered = true;
        },

        placeSelectedMark: function (graph, nodeCoords) {
            const markCoords = {
                coords: {
                    x: nodeCoords.x + SELECTED_MARK.offset.x,
                    y: nodeCoords.y + SELECTED_MARK.offset.y
                }
            };

            const h = {
                id: SELECTED_MARK.id,
                name: '',
                nodeType: SELECTED_MARK.type,
                posX: VcUtils.transformCoord(markCoords, 'x'),
                posY: VcUtils.transformCoord(markCoords, 'y'),
            };

            graph.createNode(h);
        },

        rmSelectedMark: function (graph) {
            graph.deleteNode(SELECTED_MARK.id);
        },

        vcNodeText: function (node, data) {
            const lines = VcUtils.descriptionLines(node, data);

            const info = VcUtils.infoLine(node);

            const branch = VcUtils.branchDescription(node, data);

            lines.push(info, branch);

            return lines.join('\n');
        },

        descriptionLines: function (node, data) {
            let descr = node.checkpointData.description;

            descr = VcUtils.descriptionCleanUp(descr);

            if (data.vcHistItem) {
                descr = VcUtils.addHistPrefix(descr, node);
            }

            const lines = editor.call(
                'vcgraph:splitNodeDescription',
                descr,
                CHARS_PER_LINE,
                TRUNCATE_TOKEN_LIMIT
            );

            return lines.slice(0, DESCRIPTION_LINES);
        },

        addHistPrefix: function (descr, h) {
            let pref = VcUtils.calcHistPrefix(h.histGraphData);

            pref = pref ? `[${pref}] ` : '';

            return pref + descr;
        },

        calcHistPrefix: function (h) {
            if (h.vcNoHistData) {
                return 'no hist';
            } else if (h.vcAction === 'added') {
                return '+';
            } else if (h.vcAction === 'removed') {
                return 'x';
            } else if (h.vcEqualToSrc) {
                return '= src';
            } else if (h.vcHistTooLarge) {
                return 'large';
            } else if (!h.vcAction) {
                return '=';
            }
        },

        descriptionCleanUp: function (s) {
            s = s.replace(/\('[a-z0-9]{7}'\)/g, '');

            s = s.replace(/\[[a-z0-9]{7}\]/g, '');

            s = s.replace(/"/g, '\'');

            s = s.replace(/, parent checkpoint:.+$/, '');

            s = s.replace(/^(Checkpoint before merging).+$/, '$1');

            s = s.replace(/^(Merged branch.+') into '.*$/, '$1');

            return s.replace(/\s+/g, ' ');
        },

        infoLine: function (node) {
            const id = node.id.substring(0, NUM_ID_CHARS);

            const h = node.checkpointData;

            const dateStr = VcUtils.epochToStr(h.created_at);

            const parts = [ id, dateStr ];

            if (h.user_full_name) {
                parts.push(h.user_full_name);
            }

            const s = parts.join(' ');

            return VcUtils.truncateLine(s, CHARS_PER_LINE);
        },

        branchDescription: function (node, data) {
            const h = data.branches[node.branchId];

            const closed = h.closed ? CLOSED_BRANCH_SUFFIX : '';

            const limit = CHARS_PER_LINE - closed.length;

            const name = VcUtils.truncateLine(h.name, limit);

            return name + closed;
        },

        truncateLine: function (s, limit) {
            s = s.substring(0, limit);

            return s.trim();
        },

        epochToStr: function (n) {
            const d = new Date(n);

            return d.toLocaleDateString();
        },

        nodeToColorType: function (h, data) {
            return data.branches[h.branchId].vcBranchColor;
        },

        renderAllVcEdges: async function (data){
            const nodes = Object.values(data.idToNode);

            const edges = [];

            nodes.forEach(h => VcUtils.edgesToRenderForNode(h, data, edges));

            for (const h of edges) {
                await VcUtils.waitMs(1);

                VcUtils.renderOneEdge(data, h);
            }
        },

        waitMs: function (n) {
            return new Promise(resolve => setTimeout(resolve, n));
        },

        renderAllVcNodes: function (data) {
            let a = Object.values(data.idToNode);

            a = a.filter(VcUtils.nodeNeedsRender);

            a.forEach(h => VcUtils.renderVcNode(h, data));
        },

        nodeNeedsRender: function (h) {
            return !h.isNodeRendered || h.hasNewCoords;
        },

        transformCoord: function (h, field) {
            return COORD_COEFS[field] * h.coords[field] + COORD_OFFSETS[field];
        },

        addEdgeToRender: function (data, h, res) {
            h.vcEdgeId = VcUtils.makeEdgeId(h);

            const ch1 = data.idToNode[h.parent];

            const ch2 = data.idToNode[h.child];

            const need = !data.renderedEdges[h.vcEdgeId] &&
                ch1 && ch2;

            if (need) {
                res.push(h);
            }
        },

        renderOneEdge: function (data, h) {
            data.renderedEdges[h.vcEdgeId] = true;

            const type = VcUtils.nodeToColorType(data.idToNode[h.parent], data);

            const params = {
                from: h.parent,
                to: h.child,
                edgeType: type
            };

            data.graph.createEdge(params, h.vcEdgeId);
        },

        handleAllCorners: function (data) {
            const a = Object.values(data.idToNode);

            a.forEach(h => {
                const oldVal = !!h.isExpandable;

                h.isExpandable = VcUtils.isNodeExpandable(h, data.idToNode);

                const needRefresh = h.isExpandable !== oldVal && h.isNodeRendered;

                if (needRefresh) {
                    VcUtils.tmpRmNode(h, data);
                }
            });
        },

        makeEdgeId: function (h) {
            return `${h.parent}-${h.child}`;
        },

        rmEdgesForNode: function (node, renderedEdges, graph) {
            VcUtils.iterAllEdges(node, (n, edge, type) => {
                graph.deleteEdge(edge.vcEdgeId);

                delete renderedEdges[edge.vcEdgeId];
            });
        },

        edgesToRenderForNode: function (h, data, res) {
            VcUtils.iterAllEdges(h, (node, edge, type) => {
                VcUtils.addEdgeToRender(data, edge, res);
            });
        },

        isNodeExpandable: function (h, idToNode) {
            let res = false;

            VcUtils.iterAllEdges(h, (node, edge, type) => {
                res = res || !idToNode[edge.parent] || !idToNode[edge.child];
            });

            return res;
        },

        tmpRmNode: function (h, data) {
            VcUtils.rmEdgesForNode(h, data.renderedEdges, data.graph);

            data.graph.deleteNode(h.id);

            h.isNodeRendered = false;

            h.wasRendered = true;
        },

        permRmNode: function (h, data) {
            VcUtils.rmEdgesForNode(h, data.renderedEdges, data.graph);

            data.graph.deleteNode(h.id);

            VcUtils.rmAllEdges(h, 'parent', 'child', data);

            VcUtils.rmAllEdges(h, 'child', 'parent', data);

            delete data.idToNode[h.id];
        },

        rmAllEdges: function (h1, type1, type2, data) {
            h1[type1].forEach(edge => {
                const h2 = data.idToNode[edge[type1]];

                h2 && VcUtils.rmOneEdge(h2, type2, h1.id);
            });
        },

        rmOneEdge: function (h, type, id) {
            h[type] = h[type].filter(edge => {
                return edge[type] !== id;
            });
        },

        initVcGraph: function (container, closeBtn) {
            VcUtils.branchCount = 0;

            const h = {
                dom: container.dom,
            };

            Object.assign(h, GRAPH_DEFAULTS);

            const schema = VcUtils.makeSchema();

            const graph = new pcuiGraph.Graph(schema, h);

            graph.dom.appendChild(closeBtn.dom);

            return graph;
        },

        makeSchema: function () {
            const res = { nodes: {}, edges: {} };

            const styles = editor.call('vcgraph:getAllStyles');

            const edgeDefaults = VcUtils.makeEdgeDefaults(styles.length);

            styles.forEach((h, i) => {
                res.nodes[i] = VcUtils.vcNodeSchema(h.fill, h.stroke, i);

                res.edges[i] = VcUtils.vcEdgeSchema(h.stroke, edgeDefaults);
            });

            return res;
        },

        makeEdgeDefaults: function (n) {
            const a = VcUtils.makeIntArray(n);

            const h = {
                from: a,
                to: a
            };

            return Object.assign(h, EDGE_DEFAULTS);
        },

        makeIntArray: function (n) {
            const a = [];

            for (let i = 0; i < n; i++) {
                a.push(i);
            }

            return a;
        },

        vcNodeSchema: function (fill, stroke, i) {
            const h = {
                fill: fill,
                stroke: stroke,
                strokeSelected: stroke,
                strokeHover: stroke
            };

            const def = i ? NODE_DEFAULTS : SELECTED_MARK.defaults;

            return Object.assign(h, def);
        },

        vcEdgeSchema: function (stroke, defaults) {
            const h = {
                stroke: stroke
            };

            return Object.assign(h, defaults);
        },

        pushArToAr: function(a1, a2) {
            Array.prototype.push.apply(a1, a2);
        },

        forAllEdgeTypes: function (node, callback) {
            VC_EDGE_TYPES.forEach(type => {
                callback(node, node[type], type);
            });
        },

        iterAllEdges: function (node, callback) {
            VcUtils.forAllEdgeTypes(node, (node, edges, type) => {
                VcUtils.iterEdgeType(node, edges, type, callback);
            });
        },

        iterEdgeType: function (node, edges, type, callback) {
            edges.forEach(edge => {
                callback(node, edge, type);
            });
        },

        nextBranchCoordX: function () {
            return VcUtils.branchCount++;
        },

        assignBranchColors: function (data) {
            let a = Object.values(data.branches);

            a = a.filter(h => h.vcBranchColor === undefined);

            VcUtils.sortByIntField(a, 'created_at');

            a.forEach(VcUtils.setColorForBranch);
        },

        sortByIntField: function (ar, field) {
            ar.sort((a, b) => {
                return a[field] - b[field];
            });
        },

        setColorForBranch: function (h) {
            let n = VcUtils.strToHashCode(h.name);

            n = n % editor.call('vcgraph:numStyles');

            h.vcBranchColor = Math.max(1, n); // 0 is the special marker node
        },

        groupByPath: function (a, path) {
            const res = {};

            a.forEach(h => {
                const k = editor.call('template:utils', 'getNodeAtPath', h, path);

                VcUtils.addToArrayField(res, k, h);
            })

            return res;
        },

        addToArrayField: function (dst, field, val) {
            const a = VcUtils.setArrayField(dst, field);

            a.push(val);
        },

        setArrayField: function (h, field) {
            const a = h[field] || [];

            h[field] = a;

            return a;
        },

        sortGroupsByY: function (groups) {
            const idToMinY = {};

            groups.forEach(a => {
                idToMinY[a[0].branchId] = VcUtils.minByPath(a, ['coords', 'y']);
            });

            groups.sort((a, b) => {
                return idToMinY[a[0].branchId] - idToMinY[b[0].branchId];
            });
        },

        sortObjsByPath: function (ar, path, isDesc) {
            const sign = isDesc ? -1 : 1;

            return ar.sort((a, b) => {
                const v1 = editor.call('template:utils', 'getNodeAtPath', a, path);

                const v2 = editor.call('template:utils', 'getNodeAtPath', b, path);

                return sign * (v1 - v2);
            });
        },

        minByPath: function (a, path) {
            let res;

            a.forEach(h => {
                const v = editor.call('template:utils', 'getNodeAtPath', h, path);

                if (res === undefined || v < res) {
                    res = v;
                }
            });

            return res;
        },

        findMaxKey: function (h) {
            let a = Object.keys(h);

            a = a.map(s => parseInt(s, 10));

            return Math.max(...a);
        },

        findLimitNodes: function (a) {
            const res = {
                minYNode: a[0],
                maxYNode: a[0]
            };

            a.forEach(h => {
                const y = h.coords.y;

                if (y < res.minYNode.coords.y) {
                    res.minYNode = h;
                }

                if (y > res.maxYNode.coords.y) {
                    res.maxYNode = h;
                }
            });

            return res;
        },

        allIndexes: function (lastInd) {
            const a = [];

            for (let i = 0; i <= lastInd; i++) {
                a.push(i);
            }

            return a;
        },

        // Top left coords and width/height of the box rel to screen
        nodeToScreenCoords: function (node, graph) {
            const scale = graph.getGraphScale();

            const grPos = graph.getGraphPosition();

            const h = {
                x: VcUtils.transformCoord(node, 'x'),
                y: VcUtils.transformCoord(node, 'y')
            };

            h.x = grPos.x + (h.x * scale) + SCREEN_COORD_OFFSET.x;
            h.y = grPos.y + (h.y * scale) + SCREEN_COORD_OFFSET.y;

            h.w = NODE_DEFAULTS.baseWidth * scale;
            h.h = NODE_DEFAULTS.baseHeight * scale;

            return h;
        },

        minBetweenNodes: function () {
            return MIN_BETWEEN_NODES;
        },

        strToHashCode: function (s) {
            let hash = 0;

            for (let i = 0; i < s.length; i++) {
                let chr = s.charCodeAt(i);

                hash = ((hash << 5) - hash) + chr;

                hash |= 0; // Convert to 32bit integer
            }

            return Math.abs(hash);
        },

        vcNodeClick: function (id, expandCallback, data) {
            const node = data.idToNode[id];

            const coords = VcUtils.nodeToScreenCoords(node, data.graph);

            const h = {
                onExpandSelect: function () {
                    VcUtils.expandVcNode(node, data.vcHistItem, expandCallback);
                }
            };

            Object.assign(h, node);

            editor.call('vcgraph:showNodeMenu', data.vcNodeMenu, h, data, coords);
        },

        expandVcNode: function (node, histItem, callback) {
            const h = {
                branchId: node.branchId,
                graphStartId: node.id,
                vcHistItem: histItem
            };

            VcUtils.backendGraphTask(h, callback);
        },

        backendGraphTask: function (h, callback) {
            h.task_type = 'vc_graph_for_branch';

            h.branch = h.branchId;

            editor.call('checkpoints:list', h, callback);
        },

        launchItemHist: function (type, id) {
            const h = {
                vcHistItem: `${type}-${id}`,
                closeVcPicker: true,
                branchId: config.self.branch.id
            };

            editor.call('picker:versioncontrol');

            editor.call('vcgraph:showGraphPanel', h);
        },

        equalHistNodes: function (h1, h2) {
            h1 = VcUtils.cleanHistNode(h1);

            h2 = VcUtils.cleanHistNode(h2);

            return editor.call('assets:isDeepEqual', h1, h2);
        },

        cleanHistNode: function (h) {
            const res = { parent: [], child: [] };

            [ 'parent', 'child' ].forEach(s => VcUtils.cleanEdges(res, h, s));

            return res;
        },

        cleanEdges: function (res, h, field) {
            res[field] = h[field].map(edge => {
                return VcUtils.fieldsFromHash(edge, [ 'parent', 'child', 'branch_id' ]);
            });
        },

        fieldsFromHash: function (h, a) {
            const res = {};

            a.forEach(s => {
                res[s] = h[s];
            });

            return res;
        }
    };

    editor.method('vcgraph:utils', function () {
        const a = Array.from(arguments);

        return editor.call('utils:callMethod', VcUtils, a);
    });
});
