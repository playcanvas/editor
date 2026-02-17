editor.once('load', () => {
    class DeepEqual {
        node1: unknown;

        node2: unknown;

        bothNodes: unknown[];

        constructor(node1: unknown, node2: unknown) {
            this.node1 = node1;

            this.node2 = node2;

            this.bothNodes = [node1, node2];
        }

        run() {
            if (this.node1 === this.node2) {
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

        handleMaps() {
            const keys1 = Object.keys(this.node1);

            const keys2 = Object.keys(this.node2);

            const sameLen = keys1.length === keys2.length;

            return sameLen && this.compareMapsRecursively(keys1);
        }

        compareMapsRecursively(keys1: string[]): boolean {
            return keys1.every((k1) => {
                return this.node2.hasOwnProperty(k1) &&
                    new DeepEqual(this.node1[k1], this.node2[k1]).run();
            });
        }

        handleArrays() {
            const sameLen = this.node1.length === this.node2.length;

            return sameLen && this.compareArraysRecursively();
        }

        compareArraysRecursively() {
            return this.node1.every((v1, index) => {

                const v2 = this.node2[index];

                return new DeepEqual(v1, v2).run();
            });
        }

        areBothMaps(): boolean {
            return this.bothNodes.every((h) => {
                return editor.call('template:utils', 'isMapObj', h);
            });
        }

        areBothArrays() {
            return this.bothNodes.every(Array.isArray);
        }
    }

    /**
     * Perform a deep comparison of two nodes consisting of
     * objects, arrays and scalar values.
     *
     * @param node1 - First object to compare
     * @param node2 - Second object to compare
     * @returns True if the nodes are deep-equal
     */
    editor.method('assets:isDeepEqual', (node1: unknown, node2: unknown): boolean => {
        return new DeepEqual(node1, node2).run();
    });
});
