import type { Container, Menu } from '@playcanvas/pcui';
import Graph from '@playcanvas/pcui-graph';

import { handleCallback } from '@/common/utils';
import { applyUserThumbnail } from '@/editor/pickers/version-control/vc-helpers';

editor.once('load', () => {
    const COORD_OFFSETS = { x: 80, y: 50 };

    const COORD_COEFS = { x: 265, y: 110 };

    const VC_GRAPH_NODE_ICON = '\uE431';

    const VC_GRAPH_NODE_FILL = '#2a3437';

    const VC_GRAPH_NODE_TEXT = 'transparent';

    const VC_GRAPH_NODE_WIDTH = 226;

    const VC_GRAPH_NODE_HEIGHT = 72;

    const VC_GRAPH_NODE_RADIUS = 6;

    const VC_GRAPH_NODE_LINE_HEIGHT = 13;

    const VC_GRAPH_NODE_HOVER_STROKE = '#fff';

    const VC_GRAPH_FALLBACK_ACCENT = '#f60';

    const VC_GRAPH_BRANCH_COLOR_START = 13;

    const VC_GRAPH_SMALL_QUERY = '(max-width: 1099px)';

    const VC_GRAPH_DATE_FORMAT = {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    } as const;

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
        textColor: VC_GRAPH_NODE_TEXT,
        baseHeight: VC_GRAPH_NODE_HEIGHT,
        baseWidth: VC_GRAPH_NODE_WIDTH,
        lineHeight: VC_GRAPH_NODE_LINE_HEIGHT,
        textAlignMiddle: false,
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

    // graph host (.vc-graph-container) screen origin when fullscreen — 40px left toolbar, 33px
    // header. SCREEN_COORD_OFFSET is calibrated for this; in the smaller box the host moves, so
    // the menu shifts by (current host origin - this)
    const VC_GRAPH_FS_HOST = { x: 40, y: 33 };

    const MIN_BETWEEN_NODES = {
        large: 2,
        small: 1
    };

    const VC_EDGE_TYPES = ['parent', 'child'];

    const DESCRIPTION_LINES = 2;

    const CHARS_PER_LINE = 27;

    const TRUNCATE_TOKEN_LIMIT = 7;

    const NUM_ID_CHARS = 7;

    const CLOSED_BRANCH_SUFFIX = ' [x]';

    let branchCount = 0;

    // current graph + its host, so the picker can force a paper resize on fullscreen toggle
    // (pcui-graph only auto-resizes via a ResizeObserver, which misses the class-driven toggle)
    let currentGraph: (Graph & { _resizeGraph?: (el: HTMLElement) => void }) | null = null;
    let currentGraphDom: HTMLElement | null = null;

    interface VcGraphData {
        idToNode: Record<string, Record<string, unknown>>;
        branches: Record<string, Record<string, unknown>>;
        graph: Graph;
        renderedEdges: Record<string, boolean>;
        vcNodeMenu?: Menu;
        vcHistItem?: unknown;
    }

    const VcUtils = {
        renderVcNode: function (h: Record<string, unknown>, data: VcGraphData) {
            if (h.isNodeRendered) {
                VcUtils.updateRenderedPosition(h, data);
                VcUtils.renderNodeContent(h, data);
            } else {
                VcUtils.renderNewNode(h, data);
            }

            h.hasNewCoords = false;
        },

        updateRenderedPosition: function (h: Record<string, unknown>, data: VcGraphData) {
            if (h.hasNewCoords) {
                data.graph.updateNodePosition(h.id, {
                    x: VcUtils.transformCoord(h, 'x'),
                    y: VcUtils.transformCoord(h, 'y')
                });
            }
        },

        renderNewNode: function (h: Record<string, unknown>, data: VcGraphData) {
            data.graph.createNode({
                id: h.id,
                name: '',
                nodeType: VcUtils.nodeToColorType(h, data),
                posX: VcUtils.transformCoord(h, 'x'),
                posY: VcUtils.transformCoord(h, 'y'),
                marker: h.isExpandable
            });

            VcUtils.renderNodeContent(h, data);

            h.isNodeRendered = true;
        },

        placeSelectedMark: function (graph: Graph, nodeCoords: { x: number; y: number }) {
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
                posY: VcUtils.transformCoord(markCoords, 'y')
            };

            graph.createNode(h);
        },

        rmSelectedMark: function (graph: Graph) {
            graph.deleteNode(SELECTED_MARK.id);
        },

        vcNodeContent: function (node: Record<string, unknown>, data: VcGraphData) {
            const h = node.checkpointData as Record<string, unknown>;

            return {
                title: VcUtils.descriptionLines(node, data).join(' '),
                user: String(h.user_full_name || ''),
                userId: VcUtils.vcNodeUserId(h),
                date: VcUtils.epochToDisplayStr(Number(h.created_at)),
                hash: String(node.id).substring(0, NUM_ID_CHARS),
                accent: VcUtils.nodeAccent(node, data),
                expandable: Boolean(node.isExpandable)
            };
        },

        vcNodeUserId: function (h: Record<string, unknown>) {
            const user = h.user as Record<string, unknown> | undefined;

            return h.user_id || h.userId || user?.id;
        },

        epochToDisplayStr: function (n: number) {
            const d = new Date(n);

            return d.toLocaleDateString(undefined, VC_GRAPH_DATE_FORMAT);
        },

        nodeAccent: function (node: Record<string, unknown>, data: VcGraphData) {
            const styles = editor.call('vcgraph:getAllStyles');

            const style = styles[VcUtils.nodeToColorType(node, data)];

            return style?.stroke || VC_GRAPH_FALLBACK_ACCENT;
        },

        vcNodeText: function (node: Record<string, unknown>, data: VcGraphData) {
            const lines = VcUtils.descriptionLines(node, data);

            const info = VcUtils.infoLine(node);

            const branch = VcUtils.branchDescription(node, data);

            lines.push(info, branch);

            return lines.join('\n');
        },

        renderNodeContent: function (node: Record<string, unknown>, data: VcGraphData) {
            const el = data.graph.view.getNodeDomElement(String(node.id));

            const div = el?.querySelector<HTMLElement>('.graph-node-div');

            if (!div) {
                return;
            }

            const h = VcUtils.vcNodeContent(node, data);
            const compareBase = VcUtils.isCompareBase(node, data.graph);

            VcUtils.roundNodeRects(el);

            el.classList.toggle('vc-graph-node-compare-base', compareBase);

            div.className = 'graph-node-div vc-graph-node';
            div.style.setProperty('--vc-graph-node-accent', h.accent);
            div.replaceChildren();

            VcUtils.appendNodeIcon(div, h.userId);
            VcUtils.appendNodeText(div, 'vc-graph-node-title', h.title);
            VcUtils.appendNodeText(div, 'vc-graph-node-user', h.user);
            VcUtils.appendNodeText(div, 'vc-graph-node-date', h.date);
            VcUtils.appendNodeText(div, 'vc-graph-node-hash', h.hash);

            if (h.expandable) {
                const marker = VcUtils.appendNodeText(div, 'vc-graph-node-expandable', '');

                marker.style.color = h.accent;
            }

        },

        isCompareBase: function (node: Record<string, unknown>, graph: Graph) {
            const selected = (graph as Graph & { selectedForCompare?: Record<string, unknown> | null }).selectedForCompare;

            return node.vcCompareBase || selected?.id === node.id;
        },

        roundNodeRects: function (el: Element) {
            el.querySelectorAll<SVGRectElement>('rect[joint-selector="body"], rect[joint-selector="labelBackground"]').forEach((rect) => {
                rect.setAttribute('rx', String(VC_GRAPH_NODE_RADIUS));
                rect.setAttribute('ry', String(VC_GRAPH_NODE_RADIUS));
            });
        },

        appendNodeIcon: function (parent: HTMLElement, userId: unknown) {
            if (!userId) {
                VcUtils.appendNodeText(parent, 'vc-graph-node-icon vc-graph-node-icon-fallback', VC_GRAPH_NODE_ICON);
                return;
            }

            const img = document.createElement('img');

            img.className = 'vc-graph-node-icon';
            img.alt = '';
            applyUserThumbnail(img, userId as string | number, 28);
            parent.appendChild(img);
        },

        appendNodeText: function (parent: HTMLElement, cls: string, text: string) {
            const el = document.createElement('span');

            el.className = cls;
            el.textContent = text;
            parent.appendChild(el);

            return el;
        },

        refreshCompareSelection: function (data: VcGraphData, oldNode?: Record<string, unknown> | null, newNode?: Record<string, unknown> | null) {
            if (oldNode) {
                VcUtils.renderNodeContent(oldNode, data);
            }

            if (newNode && newNode !== oldNode) {
                VcUtils.renderNodeContent(newNode, data);
            }

            VcUtils.renderCompareTray(data);
        },

        descriptionLines: function (node: Record<string, unknown>, data: VcGraphData) {
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

        addHistPrefix: function (descr: string, h: Record<string, unknown>) {
            let pref = VcUtils.calcHistPrefix(h.histGraphData);

            pref = pref ? `[${pref}] ` : '';

            return pref + descr;
        },

        calcHistPrefix: function (h: Record<string, unknown>) {
            if (h.vcNoHistData) {
                return 'no hist';
            }
            if (h.vcAction === 'added') {
                return '+';
            }
            if (h.vcAction === 'removed') {
                return 'x';
            }
            if (h.vcEqualToSrc) {
                return '= src';
            }
            if (h.vcHistTooLarge) {
                return 'large';
            }
            if (!h.vcAction) {
                return '=';
            }
        },

        descriptionCleanUp: function (s: string) {
            s = s.replace(/\('[a-z0-9]{7}'\)/g, '');

            s = s.replace(/\[[a-z0-9]{7}\]/g, '');

            s = s.replace(/"/g, '\'');

            s = s.replace(/, parent checkpoint:.+$/, '');

            s = s.replace(/^(Checkpoint before merging).+$/, '$1');

            s = s.replace(/^(Merged branch.+') into '.*$/, '$1');

            return s.replace(/\s+/g, ' ');
        },

        infoLine: function (node: Record<string, unknown>) {
            const id = node.id.substring(0, NUM_ID_CHARS);

            const h = node.checkpointData;

            const dateStr = VcUtils.epochToStr(h.created_at);

            const parts = [id, dateStr];

            if (h.user_full_name) {
                parts.push(h.user_full_name);
            }

            const s = parts.join(' ');

            return VcUtils.truncateLine(s, CHARS_PER_LINE);
        },

        branchDescription: function (node: Record<string, unknown>, data: VcGraphData) {
            const h = data.branches[node.branchId];

            const closed = h.closed ? CLOSED_BRANCH_SUFFIX : '';

            const limit = CHARS_PER_LINE - closed.length;

            const name = VcUtils.truncateLine(h.name, limit);

            return name + closed;
        },

        truncateLine: function (s: string, limit: number) {
            s = s.substring(0, limit);

            return s.trim();
        },

        epochToStr: function (n: number) {
            const d = new Date(n);

            return d.toLocaleDateString();
        },

        nodeToColorType: function (h: Record<string, unknown>, data: VcGraphData) {
            return data.branches[h.branchId].vcBranchColor;
        },

        renderAllVcEdges: async function (data: VcGraphData) {
            const nodes = Object.values(data.idToNode);

            const edges = [];

            nodes.forEach(h => VcUtils.edgesToRenderForNode(h, data, edges));

            for (const h of edges) {
                await VcUtils.waitMs(1); // eslint-disable-line no-await-in-loop

                VcUtils.renderOneEdge(data, h);
            }
        },

        waitMs: function (n: number) {
            return new Promise((resolve) => {
                setTimeout(resolve, n);
            });
        },

        renderAllVcNodes: function (data: VcGraphData) {
            let a = Object.values(data.idToNode);

            a = a.filter(VcUtils.nodeNeedsRender);

            a.forEach(h => VcUtils.renderVcNode(h, data));
        },

        renderBranchLegend: function (data: VcGraphData) {
            const legend = VcUtils.branchLegend(data.graph);
            const list = legend.querySelector<HTMLElement>('.vc-graph-legend-list');
            const styles = editor.call('vcgraph:getAllStyles');
            const branchIds = new Set(Object.values(data.idToNode).map(h => h.branchId));
            const branches = Object.entries(data.branches)
            .filter(([id, h]) => branchIds.has(id) && h.name && h.vcBranchColor !== undefined)
            .map(([, h]) => h);

            VcUtils.sortByIntField(branches, 'created_at');
            list?.replaceChildren();
            legend.hidden = !branches.length;
            legend.open = legend.dataset.open ? legend.dataset.open === 'true' : !VcUtils.isSmallGraph(data.graph);
            legend.classList.toggle('pcui-collapsed', !legend.open);

            branches.forEach((h) => {
                const item = document.createElement('span');
                const dot = document.createElement('span');
                const label = document.createElement('span');
                const name = String(h.name) + (h.closed ? CLOSED_BRANCH_SUFFIX : '');

                item.className = 'vc-graph-legend-item';
                item.title = name;
                dot.className = 'vc-graph-legend-dot';
                dot.style.backgroundColor = styles[Number(h.vcBranchColor)]?.stroke || VC_GRAPH_FALLBACK_ACCENT;
                label.className = 'vc-graph-legend-label';
                label.textContent = name;
                item.append(dot, label);
                list?.appendChild(item);
            });
        },

        renderCompareTray: function (data: VcGraphData) {
            const tray = VcUtils.compareTray(data.graph);
            const selected = (data.graph as Graph & { selectedForCompare?: Record<string, unknown> | null }).selectedForCompare;

            tray.replaceChildren();
            tray.hidden = !selected;
            tray.style.borderColor = '';

            if (!selected) {
                return;
            }

            const h = VcUtils.vcNodeContent(selected, data);
            const branch = data.branches[String(selected.branchId)];
            const info = document.createElement('span');
            const label = document.createElement('span');
            const title = document.createElement('span');
            const meta = document.createElement('span');
            const clear = document.createElement('button');

            tray.style.borderColor = h.accent;
            info.className = 'vc-graph-compare-info';
            label.className = 'vc-graph-compare-label';
            title.className = 'vc-graph-compare-title';
            meta.className = 'vc-graph-compare-meta';
            clear.className = 'vc-graph-compare-clear';
            clear.type = 'button';
            label.textContent = 'Compare base';
            title.textContent = h.title;
            meta.textContent = `${String(branch?.name || '')} · ${h.hash} · ${h.date}`;
            clear.textContent = 'Clear';
            clear.addEventListener('click', () => {
                selected.vcCompareBase = false;
                (data.graph as Graph & { selectedForCompare?: Record<string, unknown> | null }).selectedForCompare = null;
                VcUtils.renderNodeContent(selected, data);
                VcUtils.renderCompareTray(data);
            });

            info.append(label, title, meta);
            tray.append(VcUtils.compareAvatar(h.userId), info, clear);
        },

        compareTray: function (graph: Graph) {
            let tray = graph.dom.querySelector<HTMLElement>('.vc-graph-compare-tray');

            if (!tray) {
                tray = document.createElement('div');
                tray.className = 'vc-graph-compare-tray';
                VcUtils.overlayStack(graph).appendChild(tray);
            }

            return tray;
        },

        compareAvatar: function (userId: unknown) {
            if (!userId) {
                const icon = document.createElement('span');

                icon.className = 'vc-graph-compare-avatar vc-graph-node-icon-fallback';
                icon.textContent = VC_GRAPH_NODE_ICON;

                return icon;
            }

            const img = document.createElement('img');

            img.className = 'vc-graph-compare-avatar';
            img.alt = '';
            applyUserThumbnail(img, userId as string | number, 22);

            return img;
        },

        branchLegend: function (graph: Graph) {
            let legend = graph.dom.querySelector<HTMLDetailsElement>('.vc-graph-legend');

            if (!legend) {
                const header = document.createElement('summary');
                const title = document.createElement('span');
                const list = document.createElement('div');

                legend = document.createElement('details');
                legend.className = 'pcui-panel pcui-collapsible vc-graph-legend';
                header.className = 'pcui-panel-header';
                title.className = 'pcui-panel-header-title';
                title.textContent = 'LEGEND';
                list.className = 'pcui-panel-content vc-graph-legend-list';
                header.appendChild(title);
                legend.append(header, list);
                legend.addEventListener('toggle', () => {
                    legend.dataset.open = String(legend.open);
                    legend.classList.toggle('pcui-collapsed', !legend.open);
                });
                VcUtils.overlayStack(graph).appendChild(legend);
            }

            return legend;
        },

        isSmallGraph: function (graph: Graph) {
            const overlay = graph.dom.closest('.vc-graph-overlay');

            return window.matchMedia(VC_GRAPH_SMALL_QUERY).matches || !overlay?.classList.contains('fullscreen');
        },

        overlayStack: function (graph: Graph) {
            let stack = graph.dom.querySelector<HTMLElement>('.vc-graph-overlay-stack');

            if (!stack) {
                stack = document.createElement('div');
                stack.className = 'vc-graph-overlay-stack';
                graph.dom.appendChild(stack);
            }

            return stack;
        },

        nodeNeedsRender: function (h: Record<string, unknown>) {
            return !h.isNodeRendered || h.hasNewCoords;
        },

        transformCoord: function (h: Record<string, unknown>, field: 'x' | 'y') {
            return COORD_COEFS[field] * h.coords[field] + COORD_OFFSETS[field];
        },

        addEdgeToRender: function (data: VcGraphData, h: Record<string, unknown>, res: Record<string, unknown>[]) {
            h.vcEdgeId = VcUtils.makeEdgeId(h);

            const ch1 = data.idToNode[h.parent];

            const ch2 = data.idToNode[h.child];

            const need = !data.renderedEdges[h.vcEdgeId] &&
                ch1 && ch2;

            if (need) {
                res.push(h);
            }
        },

        renderOneEdge: function (data: VcGraphData, h: Record<string, unknown>) {
            data.renderedEdges[h.vcEdgeId] = true;

            const type = VcUtils.nodeToColorType(data.idToNode[h.parent], data);

            const params = {
                from: h.parent,
                to: h.child,
                edgeType: type
            };

            data.graph.createEdge(params, h.vcEdgeId);
        },

        handleAllCorners: function (data: VcGraphData) {
            const a = Object.values(data.idToNode);

            a.forEach((h) => {
                const oldVal = !!h.isExpandable;

                h.isExpandable = VcUtils.isNodeExpandable(h, data.idToNode);

                const needRefresh = h.isExpandable !== oldVal && h.isNodeRendered;

                if (needRefresh) {
                    VcUtils.tmpRmNode(h, data);
                }
            });
        },

        makeEdgeId: function (h: Record<string, unknown>) {
            return `${h.parent}-${h.child}`;
        },

        rmEdgesForNode: function (node: Record<string, unknown>, renderedEdges: Record<string, boolean>, graph: Graph) {
            VcUtils.iterAllEdges(node, (n, edge, type) => {
                graph.deleteEdge(edge.vcEdgeId);

                delete renderedEdges[edge.vcEdgeId];
            });
        },

        edgesToRenderForNode: function (h: Record<string, unknown>, data: VcGraphData, res: Record<string, unknown>[]) {
            VcUtils.iterAllEdges(h, (node, edge, type) => {
                VcUtils.addEdgeToRender(data, edge, res);
            });
        },

        isNodeExpandable: function (h: Record<string, unknown>, idToNode: Record<string, Record<string, unknown>>) {
            let res = false;

            VcUtils.iterAllEdges(h, (node, edge, type) => {
                res = res || !idToNode[edge.parent] || !idToNode[edge.child];
            });

            return res;
        },

        tmpRmNode: function (h: Record<string, unknown>, data: VcGraphData) {
            VcUtils.rmEdgesForNode(h, data.renderedEdges, data.graph);

            data.graph.deleteNode(h.id);

            h.isNodeRendered = false;

            h.wasRendered = true;
        },

        permRmNode: function (h: Record<string, unknown>, data: VcGraphData) {
            VcUtils.rmEdgesForNode(h, data.renderedEdges, data.graph);

            data.graph.deleteNode(h.id);

            VcUtils.rmAllEdges(h, 'parent', 'child', data);

            VcUtils.rmAllEdges(h, 'child', 'parent', data);

            delete data.idToNode[h.id];
        },

        rmAllEdges: function (h1: Record<string, unknown>, type1: 'parent' | 'child', type2: 'parent' | 'child', data: VcGraphData) {
            h1[type1].forEach((edge) => {
                const h2 = data.idToNode[edge[type1]];

                if (h2) {
                    VcUtils.rmOneEdge(h2, type2, h1.id);
                }
            });
        },

        rmOneEdge: function (h: Record<string, unknown>, type: 'parent' | 'child', id: string) {
            h[type] = h[type].filter((edge) => {
                return edge[type] !== id;
            });
        },

        initVcGraph: function (container: Container) {
            branchCount = 0;

            const h = {
                dom: container.dom
            };

            Object.assign(h, GRAPH_DEFAULTS);

            const schema = VcUtils.makeSchema();

            const graph = new Graph(schema, h);

            currentGraph = graph;
            currentGraphDom = container.dom;

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

        makeEdgeDefaults: function (n: number) {
            const a = VcUtils.makeIntArray(n);

            const h = {
                from: a,
                to: a
            };

            return Object.assign(h, EDGE_DEFAULTS);
        },

        makeIntArray: function (n: number) {
            const a = [];

            for (let i = 0; i < n; i++) {
                a.push(i);
            }

            return a;
        },

        vcNodeSchema: function (fill: string, stroke: string, i: number) {
            if (!i) {
                return Object.assign({
                    fill: fill,
                    stroke: stroke,
                    strokeSelected: stroke,
                    strokeHover: stroke
                }, SELECTED_MARK.defaults);
            }

            const h = {
                fill: VC_GRAPH_NODE_FILL,
                stroke: stroke,
                fillSecondary: VC_GRAPH_NODE_FILL,
                strokeSelected: stroke,
                strokeHover: VC_GRAPH_NODE_HOVER_STROKE
            };

            return Object.assign(h, NODE_DEFAULTS);
        },

        vcEdgeSchema: function (stroke: string, defaults: Record<string, unknown>) {
            const h = {
                stroke: stroke
            };

            return Object.assign(h, defaults);
        },

        pushArToAr: function (a1: unknown[], a2: unknown[]) {
            Array.prototype.push.apply(a1, a2);
        },

        forAllEdgeTypes: function (node: Record<string, unknown>, callback: (node: Record<string, unknown>, edges: unknown[], type: string) => void) {
            VC_EDGE_TYPES.forEach((type) => {
                callback(node, node[type], type);
            });
        },

        iterAllEdges: function (node: Record<string, unknown>, callback: (node: Record<string, unknown>, edge: Record<string, unknown>, type: string) => void) {
            VcUtils.forAllEdgeTypes(node, (node, edges, type) => {
                VcUtils.iterEdgeType(node, edges, type, callback);
            });
        },

        iterEdgeType: function (node: Record<string, unknown>, edges: unknown[], type: string, callback: (node: Record<string, unknown>, edge: Record<string, unknown>, type: string) => void) {
            edges.forEach((edge) => {
                callback(node, edge, type);
            });
        },

        nextBranchCoordX: function () {
            return branchCount++;
        },

        assignBranchColors: function (data: VcGraphData) {
            const a = Object.values(data.branches);

            VcUtils.sortByIntField(a, 'created_at');

            a.forEach(VcUtils.setColorForBranch);
        },

        sortByIntField: function (ar: Record<string, unknown>[], field: string) {
            ar.sort((a, b) => {
                return a[field] - b[field];
            });
        },

        setColorForBranch: function (h: Record<string, unknown>, i: number) {
            const n = Number(editor.call('vcgraph:numStyles')) - 1;

            h.vcBranchColor = 1 + ((VC_GRAPH_BRANCH_COLOR_START - 1 + i) % n);
        },

        groupByPath: function (a: Record<string, unknown>[], path: string[]) {
            const res = {};

            a.forEach((h) => {
                const k = editor.call('template:utils', 'getNodeAtPath', h, path);

                VcUtils.addToArrayField(res, k, h);
            });

            return res;
        },

        addToArrayField: function (dst: Record<string, unknown[]>, field: string, val: unknown) {
            const a = VcUtils.setArrayField(dst, field);

            a.push(val);
        },

        setArrayField: function (h: Record<string, unknown>, field: string) {
            const a = h[field] || [];

            h[field] = a;

            return a;
        },

        sortGroupsByY: function (groups: Record<string, unknown>[][]) {
            const idToMinY = {};

            groups.forEach((a) => {
                idToMinY[a[0].branchId] = VcUtils.minByPath(a, ['coords', 'y']);
            });

            groups.sort((a, b) => {
                return idToMinY[a[0].branchId] - idToMinY[b[0].branchId];
            });
        },

        sortObjsByPath: function (ar: Record<string, unknown>[], path: string[], isDesc: boolean) {
            const sign = isDesc ? -1 : 1;

            return ar.sort((a, b) => {
                const v1 = editor.call('template:utils', 'getNodeAtPath', a, path);

                const v2 = editor.call('template:utils', 'getNodeAtPath', b, path);

                return sign * (v1 - v2);
            });
        },

        minByPath: function (a: Record<string, unknown>[], path: string[]) {
            let res;

            a.forEach((h) => {
                const v = editor.call('template:utils', 'getNodeAtPath', h, path);

                if (res === undefined || v < res) {
                    res = v;
                }
            });

            return res;
        },

        findMaxKey: function (h: Record<string, unknown>) {
            let a = Object.keys(h);

            a = a.map(s => parseInt(s, 10));

            return Math.max(...a);
        },

        findLimitNodes: function (a: Record<string, unknown>[]) {
            const res = {
                minYNode: a[0],
                maxYNode: a[0]
            };

            a.forEach((h) => {
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

        allIndexes: function (lastInd: number) {
            const a = [];

            for (let i = 0; i <= lastInd; i++) {
                a.push(i);
            }

            return a;
        },

        // node box position/size relative to the screen. taken from the node's actual rendered
        // element (via graph.view, as renderNodeContent does) so it stays correct wherever the
        // graph box sits — the fixed offset below only holds at the box's reference position
        nodeToScreenCoords: function (node: Record<string, unknown>, graph: Graph) {
            const scale = graph.getGraphScale();

            const grPos = graph.getGraphPosition();

            // the fixed offset is calibrated for fullscreen; when the box isn't fullscreen the host
            // sits elsewhere, so shift the menu by how far it moved from its fullscreen origin
            let offX = SCREEN_COORD_OFFSET.x;
            let offY = SCREEN_COORD_OFFSET.y;
            const overlay = graph.dom.closest('.vc-graph-overlay');
            if (overlay && !overlay.classList.contains('fullscreen')) {
                const rect = graph.dom.getBoundingClientRect();
                offX += rect.left - VC_GRAPH_FS_HOST.x;
                offY += rect.top - VC_GRAPH_FS_HOST.y;
            }

            const h = {
                x: VcUtils.transformCoord(node, 'x'),
                y: VcUtils.transformCoord(node, 'y')
            };

            h.x = grPos.x + (h.x * scale) + offX;
            h.y = grPos.y + (h.y * scale) + offY;

            h.w = NODE_DEFAULTS.baseWidth * scale;
            h.h = NODE_DEFAULTS.baseHeight * scale;

            return h;
        },

        minBetweenNodes: function () {
            return MIN_BETWEEN_NODES;
        },

        vcNodeClick: function (id: string, expandCallback: (err: unknown, data: unknown) => void, data: VcGraphData) {
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

        expandVcNode: function (node: Record<string, unknown>, histItem: unknown, callback: (err: unknown, data: unknown) => void) {
            const h = {
                branchId: node.branchId,
                graphStartId: node.id,
                vcHistItem: histItem
            };

            VcUtils.backendGraphTask(h, callback);
        },

        backendGraphTask: function (h: Record<string, unknown>, callback: (err: unknown, data: unknown) => void) {
            h.task_type = 'vc_graph_for_branch';

            h.branch = h.branchId;

            handleCallback(editor.api.globals.rest.branches.branchCheckpoints({
                branchId: h.branch,
                taskType: h.task_type,
                graphStartId: h.graphStartId,
                vcHistItem: h.vcHistItem
            }), callback);
        },

        launchItemHist: function (type: string, id: string) {
            const h = {
                vcHistItem: `${type}-${id}`,
                closeVcPicker: true,
                branchId: config.self.branch.id
            };

            editor.call('picker:versioncontrol');

            editor.call('picker:versioncontrol:graph', h);
        },

        equalHistNodes: function (h1: Record<string, unknown>, h2: Record<string, unknown>) {
            h1 = VcUtils.cleanHistNode(h1);

            h2 = VcUtils.cleanHistNode(h2);

            return editor.call('assets:isDeepEqual', h1, h2);
        },

        cleanHistNode: function (h: Record<string, unknown>) {
            const res = { parent: [], child: [] };

            ['parent', 'child'].forEach(s => VcUtils.cleanEdges(res, h, s));

            return res;
        },

        cleanEdges: function (res: Record<string, unknown[]>, h: Record<string, unknown>, field: string) {
            res[field] = h[field].map((edge) => {
                return VcUtils.fieldsFromHash(edge, ['parent', 'child', 'branch_id']);
            });
        },

        fieldsFromHash: function (h: Record<string, unknown>, a: string[]) {
            const res = {};

            a.forEach((s) => {
                res[s] = h[s];
            });

            return res;
        }
    };

    // eslint-disable-next-line prefer-arrow-callback -- needs function for callMethod binding
    editor.method('vcgraph:utils', function (...args: unknown[]) {
        return editor.call('utils:callMethod', VcUtils, args);
    });

    editor.method('vcgraph:resize', () => {
        if (!currentGraphDom) {
            return;
        }
        // joint's setDimensions pins an inline px width/height on the host, which then ignores
        // the css-driven fullscreen resize. clearing it lets the host follow its flex size; the
        // optional nudge remeasures synchronously when the method is reachable
        currentGraphDom.style.width = '';
        currentGraphDom.style.height = '';
        currentGraph?._resizeGraph?.(currentGraphDom);
    });
});
