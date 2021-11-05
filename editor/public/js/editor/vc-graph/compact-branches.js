editor.once('load', function () {
    'use strict';

    //  Try to place branches above or below each other
    //  when possible, to save horizontal space
    class CompactBranches {
        constructor(data) {
            this.allNodes = Object.values(data.idToNode);

            this.branches = data.branches;
        }

        run() {
            try {
                this.iteration();

            } catch (e) {
                if (e.name === 'CompactIterDone') {
                    this.run();
                }
            }
        }

        iteration() {
            this.xToNodes = this.helper('groupByPath', this.allNodes, ['coords', 'x']);

            this.maxX = this.helper('findMaxKey', this.xToNodes);

            this.xToLimits = {};

            const a = this.helper('allIndexes', this.maxX);

            a.forEach(this.setXToLimit, this);

            a.forEach(this.handleSrcX, this);
        }

        handleSrcX(src) {
            for (let dst = 1; dst < src; dst++) {
                this.xToLimits[src] &&
                this.handleSrcDst(src, dst);
            }
        }

        handleSrcDst(src, dst) {
            const h = this.helper('groupByPath', this.xToNodes[src], ['branchId']);

            const a = Object.values(h);

            a.forEach(branch => {
                this.canMove(branch, dst) && this.moveBranch(branch, dst);
            });
        }

        canMove(branch, dst) {
            const rendered = branch.find(h => h.isNodeRendered || h.wasRendered);

            if (rendered) {
                return false;

            } else {
                const dstLim = this.xToLimits[dst];

                return !dstLim || this.branchFits(branch, dstLim);
            }
        }

        branchFits(branch, dstLim) {
            const diff = this.helper('minBetweenNodes').large;

            const brLim = this.helper('findLimitNodes', branch);

            const b1 = brLim.minYNode;
            const b2 = brLim.maxYNode;
            const d1 = dstLim.minYNode;
            const d2 = dstLim.maxYNode;

            return (
                b1.coords.y >= d2.coords.y + diff &&
                !b1.isExpandable && !d2.isExpandable
            ) || (
                b2.coords.y + diff <= d1.coords.y &&
                !b2.isExpandable && !d1.isExpandable
            );
        }

        moveBranch(branch, dst) {
            branch.forEach(h => {
                h.hasNewCoords = true;

                h.coords.x = dst;
            });

            this.branches[branch[0].branchId].branchXCoord = dst;

            throw { name: 'CompactIterDone' };
        }

        setXToLimit(x) {
            const a = this.xToNodes[x];

            this.xToLimits[x] = a && a.length && this.helper('findLimitNodes', a);
        }

        helper(...args) {
            return editor.call('vcgraph:utils', ...args);
        }
    }

    editor.method('vcgraph:compactBranches', function (data) {
        return new CompactBranches(data).run();
    });
});
