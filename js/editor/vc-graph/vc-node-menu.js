editor.once('load', function () {
    'use strict';

    const MENU_OFFSET = { x: -30, y: -160 };

    const LOADING_COORDS = { x: 110, y: 210, w: 0 };

    const LOADING_MSG_DELAY = 70;

    editor.method('vcgraph:makeNodeMenu', function (mainPanel) {
        const m = new pcui.Menu({
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
                    text: 'Select for Compare',
                    onSelect: () => VcMenuUtils.selectForCompare(m),
                    onIsVisible: () => m.node && !VcMenuUtils.isCurSelected(m)
                },
                {
                    text: 'Deselect',
                    onSelect: () => VcMenuUtils.deselectCompare(m),
                    onIsVisible: () => m.node && VcMenuUtils.isCurSelected(m)
                },
                {
                    text: 'Compare with Selected',
                    onSelect: () => VcMenuUtils.compareTask(m),
                    onIsVisible: () => {
                        return m.node &&
                            m.vcGraphState.graph.selectedForCompare &&
                            !VcMenuUtils.isCurSelected(m);
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
                    onIsVisible: () => !m.node
                }
            ]
        });

        m.vcMainPanel = mainPanel;

        m.class.add('vc-node-menu');

        return m;
    });

    editor.method('vcgraph:showNodeMenu', function (menu, h, graphState, coords) {
        VcMenuUtils.showNodeMenu(menu, h, graphState, coords);
    });

    const VcMenuUtils = {
        newBranchMenuTask: function (menu) {
            const branchId = menu.node.branchId;

            const h = {
                id: branchId,
                name: menu.vcGraphState.branches[branchId].name
            };

            VcMenuUtils.curCheckpointTask(menu, 'checkpoint:branch', h);
        },

        branchEditOk: function (menu) {
            return menu.node.branchId === config.self.branch.id &&
                editor.call('permissions:write');
        },

        copyDataStr: function (menu) {
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

        compareTask: function (menu) {
            const h1 = menu.vcGraphState.graph.selectedForCompare;

            VcMenuUtils.startDiffTask(menu, h1, menu.node, menu.vcGraphState.vcHistItem);
        },

        viewChangesTask: function (menu) {
            VcMenuUtils.selectForCompare(menu);

            const h2 = VcMenuUtils.parentForCompare(menu);

            VcMenuUtils.startDiffTask(menu, menu.node, h2, menu.vcGraphState.vcHistItem);
        },

        fullCommitForHistTask: function (menu) {
            VcMenuUtils.selectForCompare(menu);

            VcMenuUtils.startDiffTask(menu, menu.node, menu.node.histParentNode, null);
        },

        startDiffTask: function (menu, h1, h2, histItem) {
            editor.call('vcgraph:moveToBackground');

            menu.vcMainPanel.emit(
                'diff',
                h1.branchId,
                h1.id,
                h2.branchId,
                h2.id,
                histItem
            );
        },

        parentForCompare: function (menu) {
            const p = menu.node.parent || [];

            if (p && p.length) {
                let edge = p.find(h => h.branch_id === menu.node.branchId);

                edge = edge || p[0];

                return menu.vcGraphState.idToNode[edge.parent];
            }
            return null;

        },

        selectForCompare: function (menu) {
            const graph = menu.vcGraphState.graph;

            if (graph.selectedForCompare) {
                editor.call('vcgraph:utils', 'rmSelectedMark', graph);
            }

            graph.selectedForCompare = menu.node;

            editor.call('vcgraph:utils', 'placeSelectedMark', graph, menu.node.coords);
        },

        deselectCompare: function (menu) {
            const graph = menu.vcGraphState.graph;

            graph.selectedForCompare = null;

            editor.call('vcgraph:utils', 'rmSelectedMark', graph);
        },

        isCurSelected: function (menu) {
            const sel = menu.vcGraphState.graph.selectedForCompare;

            return sel && sel.id === menu.node.id;
        },

        handleExpand: function (menu) {
            menu.vcGraphState.graph.isGraphLoading = true;

            menu.node.onExpandSelect();

            setTimeout(() => VcMenuUtils.delayedLoadingMsg(menu), LOADING_MSG_DELAY);
        },

        delayedLoadingMsg: function (menu) {
            if (menu.vcGraphState.graph.isGraphLoading) {
                VcMenuUtils.showNodeMenu(menu, null, null, menu.menuCoords);
            }
        },

        showNodeMenu: function (menu, h, graphState, coords) {
            menu.node = h;

            menu.vcGraphState = graphState;

            menu.menuCoords = coords;

            menu.hidden = false;

            coords = coords || LOADING_COORDS;

            menu.position(
                coords.x + coords.w + MENU_OFFSET.x,
                coords.y + MENU_OFFSET.y
            );
        },

        curCheckpointTask: function (menu, method, ...args) {
            editor.call('vcgraph:closeGraphPanel');

            const h = editor.call(
                'picker:versioncontrol:transformCheckpointData',
                menu.node.checkpointData
            );

            menu.vcMainPanel.emit(method, h, ...args);
        }
    };
});
