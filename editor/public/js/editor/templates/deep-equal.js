editor.once('load', function () {
    'use strict';

    class DeepEqual {
        constructor(node1, node2) {
            this.node1 = node1;

            this.node2 = node2;

            this.bothNodes = [node1, node2];
        }

        run() {
            if (this.node1 === this.node2) {
                return true;

            } else if (this.areBothMaps()) {
                return this.handleMaps();

            } else if (this.areBothArrays()) {
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

        compareMapsRecursively(keys1) {
            return keys1.every(k1 => {
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

        areBothMaps() {
            return this.bothNodes.every(h => {
                return editor.call('template:utils', 'isMapObj', h);
            });
        }

        areBothArrays() {
            return this.bothNodes.every(Array.isArray);
        }
    }

    /**
     * Perform a deep comparison of two nodes consisting of
     * ojbects, arrays and scalar values.
     *
     * @param {object} node1 - First object to compare
     * @param {object} node2 - Second object to compare
     * @returns {boolean} True if the nodes are deep-equal
     */
    editor.method('assets:isDeepEqual', function (node1, node2) {
        return new DeepEqual(node1, node2).run();
    });
});
