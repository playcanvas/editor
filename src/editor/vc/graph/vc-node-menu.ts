import { Menu } from '@playcanvas/pcui';

editor.once('load', () => {
    const MENU_OFFSET = { x: -30, y: -160 };

    const LOADING_COORDS = { x: 110, y: 210, w: 0 };

    const LOADING_MSG_DELAY = 70;

    const ACTIVE_NODE_CLASS = 'vc-graph-node-menu-open';

    editor.method('vcgraph:makeNodeMenu', (mainPanel: HTMLElement) => {
        const m = new Menu({
            items: [
                {
                    text: 'View Changes',
                    onSelect: () => VcMenuUtils.viewChangesTask(m),
                    onIsVisible: () => m.node && VcMenuUtils.parentForCompare(m)
                },
                {
                    text: 'View Full Commit',
                    onSelect: () => VcMenuUtils.fullCommitForHistTask(m),
                    onIsVisible: () => m.node && m.node.histParentNode
                },
                {
                    text: 'Set as Compare Base',
                    onSelect: () => VcMenuUtils.selectForCompare(m),
                    onIsVisible: () => m.node && !VcMenuUtils.isCurSelected(m)
                },
                {
                    text: 'Clear Compare Base',
                    onSelect: () => VcMenuUtils.deselectCompare(m),
                    onIsVisible: () => m.node && VcMenuUtils.isCurSelected(m)
                },
                {
                    text: 'Compare with Base',
                    onSelect: () => VcMenuUtils.compareTask(m),
                    onIsVisible: () => {
                        return m.node && m.vcGraphState.graph.selectedForCompare && !VcMenuUtils.isCurSelected(m);
                    }
                },
                {
                    text: 'New Branch',
                    onSelect: () => VcMenuUtils.newBranchMenuTask(m),
                    onIsVisible: () => m.node && editor.call('permissions:write')
                },
                {
                    text: 'Restore',
                    onSelect: () => VcMenuUtils.curCheckpointTask(m, 'checkpoint:restore'),
                    onIsVisible: () => m.node && VcMenuUtils.branchEditOk(m)
                },
                {
                    text: 'Hard Reset',
                    onSelect: () => VcMenuUtils.curCheckpointTask(m, 'checkpoint:hardReset'),
                    onIsVisible: () => m.node && VcMenuUtils.branchEditOk(m)
                },
                {
                    text: 'Copy Data',
                    onSelect: () => VcMenuUtils.copyDataStr(m),
                    onIsVisible: () => m.node
                },
                {
                    text: 'Expand Node',
                    onSelect: () => VcMenuUtils.handleExpand(m),
                    onIsVisible: () => m.node && m.node.isExpandable
                },
                {
                    text: 'Loading...',
                    class: 'vc-node-menu-loading-item',
                    onIsVisible: () => !m.node
                }
            ]
        });

        m.vcMainPanel = mainPanel;

        m.class.add('vc-node-menu');

        m.on('hide', () => {
            m.activeNodeEl?.classList.remove(ACTIVE_NODE_CLASS);
            m.activeNodeEl = null;
        });

        return m;
    });

    editor.method('vcgraph:showNodeMenu', (menu, h, graphState, coords) => {
        VcMenuUtils.showNodeMenu(menu, h, graphState, coords);
    });

    const VcMenuUtils = {
        newBranchMenuTask: function (
            menu: Menu & {
                node: Record<string, unknown>;
                vcGraphState: Record<string, unknown>;
                vcMainPanel: { emit: (name: string, ...args: unknown[]) => void };
            }
        ) {
            const branchId = menu.node.branchId;

            const h = {
                id: branchId,
                name: menu.vcGraphState.branches[branchId].name
            };

            VcMenuUtils.curCheckpointTask(menu, 'checkpoint:branch', h);
        },

        branchEditOk: function (menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }) {
            return menu.node.branchId === config.self.branch.id && editor.call('permissions:write');
        },

        copyDataStr: function (menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }) {
            const h = menu.node;

            const d = new Date(h.checkpointData.created_at);

            const res = {
                id: h.id,
                description: h.checkpointData.description,
                branchName: menu.vcGraphState.branches[h.branchId].name,
                branchId: h.branchId,
                user: h.checkpointData.user_full_name,
                date: d.toLocaleString()
            };

            const s = JSON.stringify(res, null, 4);

            navigator.clipboard.writeText(s);
        },

        compareTask: function (menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }) {
            const h1 = menu.vcGraphState.graph.selectedForCompare;

            VcMenuUtils.startDiffTask(menu, h1, menu.node, menu.vcGraphState.vcHistItem);
        },

        viewChangesTask: function (
            menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }
        ) {
            const h2 = VcMenuUtils.parentForCompare(menu);

            VcMenuUtils.startDiffTask(menu, menu.node, h2, menu.vcGraphState.vcHistItem);
        },

        fullCommitForHistTask: function (
            menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }
        ) {
            VcMenuUtils.startDiffTask(menu, menu.node, menu.node.histParentNode, null);
        },

        startDiffTask: function (
            menu: Menu & { vcMainPanel: { emit: (name: string, ...args: unknown[]) => void } },
            h1: Record<string, unknown>,
            h2: Record<string, unknown> | null,
            histItem: unknown
        ) {
            editor.call('vcgraph:moveToBackground');

            menu.vcMainPanel.emit('diff', h1.branchId, h1.id, h2.branchId, h2.id, histItem);
        },

        parentForCompare: function (
            menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }
        ) {
            const p = menu.node.parent || [];

            if (p && p.length) {
                let edge = p.find((h) => h.branch_id === menu.node.branchId);

                edge = edge || p[0];

                return menu.vcGraphState.idToNode[edge.parent];
            }
            return null;
        },

        selectForCompare: function (
            menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }
        ) {
            const graph = menu.vcGraphState.graph;
            const oldNode = graph.selectedForCompare;

            if (oldNode) {
                oldNode.vcCompareBase = false;
            }

            menu.node.vcCompareBase = true;
            graph.selectedForCompare = menu.node;

            editor.call('vcgraph:utils', 'refreshCompareSelection', menu.vcGraphState, oldNode, menu.node);
        },

        deselectCompare: function (
            menu: Menu & { vcGraphState: Record<string, unknown>; node?: Record<string, unknown> }
        ) {
            const graph = menu.vcGraphState.graph;
            const oldNode = graph.selectedForCompare || menu.node;

            if (oldNode) {
                oldNode.vcCompareBase = false;
            }

            graph.selectedForCompare = null;

            editor.call('vcgraph:utils', 'refreshCompareSelection', menu.vcGraphState, oldNode);
        },

        isCurSelected: function (
            menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }
        ) {
            const sel = menu.vcGraphState.graph.selectedForCompare;

            return sel && sel.id === menu.node.id;
        },

        handleExpand: function (menu: Menu & { node: Record<string, unknown>; vcGraphState: Record<string, unknown> }) {
            menu.vcGraphState.graph.isGraphLoading = true;

            menu.node.onExpandSelect();

            setTimeout(() => VcMenuUtils.delayedLoadingMsg(menu), LOADING_MSG_DELAY);
        },

        delayedLoadingMsg: function (
            menu: Menu & { vcGraphState: Record<string, unknown>; menuCoords: { x: number; y: number; w?: number } }
        ) {
            if (menu.vcGraphState.graph.isGraphLoading) {
                VcMenuUtils.showNodeMenu(menu, null, null, menu.menuCoords);
            }
        },

        showNodeMenu: function (
            menu: Menu & {
                activeNodeEl?: Element | null;
                node?: unknown;
                vcGraphState?: unknown;
                menuCoords?: { x: number; y: number; w?: number };
                position: (x: number, y: number) => void;
            },
            h: Record<string, unknown> | null,
            graphState: any,
            coords: { x: number; y: number; w?: number } | null
        ) {
            if (h) {
                menu.activeNodeEl?.classList.remove(ACTIVE_NODE_CLASS);
                menu.activeNodeEl = graphState.graph.view.getNodeDomElement(String(h.id));
                menu.activeNodeEl?.classList.add(ACTIVE_NODE_CLASS);
            }

            menu.node = h;

            menu.vcGraphState = graphState;

            menu.menuCoords = coords;

            menu.class.toggle('vc-node-menu-loading', !h);

            menu.hidden = false;

            coords = coords || LOADING_COORDS;

            menu.position(coords.x + coords.w + MENU_OFFSET.x, coords.y + MENU_OFFSET.y);
        },

        curCheckpointTask: function (
            menu: Menu & {
                node: Record<string, unknown>;
                vcMainPanel: { emit: (name: string, ...args: unknown[]) => void };
            },
            method: string,
            ...args: unknown[]
        ) {
            editor.call('vcgraph:closeGraphPanel');

            const h = editor.call('picker:versioncontrol:transformCheckpointData', menu.node.checkpointData);

            menu.vcMainPanel.emit(method, h, ...args);
        }
    };
});
