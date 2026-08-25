type Node = Record<string, unknown>;

const isMapObj = (obj: unknown): boolean => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};

class DeepEqual {
    node1: unknown;

    node2: unknown;

    bothNodes: unknown[];

    constructor(node1: unknown, node2: unknown) {
        this.node1 = node1;

        this.node2 = node2;

        this.bothNodes = [node1, node2];
    }

    run(): boolean {
        if (this.node1 === this.node2) {
            return true;
        }
        // an explicit null and an absent key encode the same unset state
        if (this.isNullish(this.node1) && this.isNullish(this.node2)) {
            return true;
        }
        if (this.areBothMaps()) {
            return this.handleMaps();
        }
        if (this.areBothArrays()) {
            return this.handleArrays();
        }
        return false;
    }

    isNullish(node: unknown): boolean {
        return node === null || node === undefined;
    }

    handleMaps(): boolean {
        const n1 = this.node1 as Node;
        const n2 = this.node2 as Node;
        const keys = new Set([...Object.keys(n1), ...Object.keys(n2)]);
        return [...keys].every((k) => {
            return new DeepEqual(n1[k], n2[k]).run();
        });
    }

    handleArrays(): boolean {
        const a1 = this.node1 as unknown[];
        const a2 = this.node2 as unknown[];
        const sameLen = a1.length === a2.length;
        return sameLen && a1.every((v1, index) => {
            return new DeepEqual(v1, a2[index]).run();
        });
    }

    areBothMaps(): boolean {
        return this.bothNodes.every((h) => isMapObj(h));
    }

    areBothArrays(): boolean {
        return this.bothNodes.every(Array.isArray);
    }
}

/**
 * Perform a deep comparison of two nodes consisting of objects, arrays and
 * scalar values.
 *
 * @param node1 - First value to compare
 * @param node2 - Second value to compare
 * @returns True if the nodes are deep-equal
 */
export const isDeepEqual = (node1: unknown, node2: unknown): boolean => {
    return new DeepEqual(node1, node2).run();
};
