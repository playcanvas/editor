import { isDeepEqual } from './deep-equal-compare';

editor.once('load', () => {
    /**
     * Perform a deep comparison of two nodes consisting of
     * objects, arrays and scalar values.
     *
     * @param node1 - First object to compare
     * @param node2 - Second object to compare
     * @returns True if the nodes are deep-equal
     */
    editor.method('assets:isDeepEqual', (node1: unknown, node2: unknown): boolean => {
        return isDeepEqual(node1, node2);
    });
});
