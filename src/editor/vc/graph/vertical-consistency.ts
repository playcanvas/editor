editor.once('load', () => {
    // Check and, if necessary, update the assigned coords of each node
    // so that there is proper distance between them vertically
    class VerticalConsistency {
        constructor(idToNode: Record<string, Record<string, unknown>>) {
            this.allNodes = Object.values(idToNode);

            this.xToMaxY = {};
        }

        run() {
            const xToNodes = this.helper('groupByPath', this.allNodes, ['coords', 'x']);

            const a = Object.values(xToNodes);

            a.forEach(this.handleXGroup, this);
        }

        handleXGroup(group: Record<string, unknown>[]) {
            const idToBranch = this.helper('groupByPath', group, ['branchId']);

            const a = Object.values(idToBranch);

            this.helper('sortGroupsByY', a);

            a.forEach(this.handleBranch, this);
        }

        handleBranch(a: Record<string, unknown>[]) {
            this.helper('sortObjsByPath', a, ['checkpointData', 'created_at'], true);

            a.forEach((h, i) => this.handleCheckpoint(h, a[i - 1]));
        }

        handleCheckpoint(h: Record<string, unknown>, prevNode: Record<string, unknown> | undefined) {
            if (prevNode) {
                this.restInBranch(h, prevNode);
            } else {
                this.firstInBranch(h);
            }

            this.xToMaxY[h.coords.x] = h.coords.y;
        }

        firstInBranch(h: Record<string, unknown>) {
            const y = this.xToMaxY[h.coords.x];

            if (y !== undefined) {
                const minGood = y + this.helper('minBetweenNodes').large;

                this.updateYIfNeeded(h, minGood);
            }
        }

        restInBranch(h: Record<string, unknown>, prevNode: Record<string, unknown>) {
            const diff = this.minDiffInBranch(h, prevNode);

            const minGood = prevNode.coords.y + diff;

            this.updateYIfNeeded(h, minGood);
        }

        updateYIfNeeded(h: Record<string, unknown>, minGood: number) {
            if (h.coords.y < minGood) {
                h.coords.y = minGood;

                h.hasNewCoords = true;
            }
        }

        minDiffInBranch(h: Record<string, unknown>, prevNode: Record<string, unknown>) {
            const diff = this.helper('minBetweenNodes');

            const connected = h.child.find(edge => edge.child === prevNode.id);

            return connected ? diff.small : diff.large;
        }

        helper(...args: unknown[]) {
            return editor.call('vcgraph:utils', ...args);
        }
    }

    editor.method('vcgraph:verticalConsistency', (data: unknown) => {
        new VerticalConsistency(data.idToNode).run();
    });
});
