/**
 * A Trie is an ordered tree-like data structure that is used for locating specific keys
 * from within a set.
 */
class Trie {
    root = {
        children: new Map(),
        isEndOfPath: false,
        parent: null
    };

    /**
     * @param {string} path - The path to insert into the trie
     */
    insert(path) {
        const pathSegments = path.split('/').filter(Boolean);
        let node = this.root;

        for (const pathSegment of pathSegments) {
            if (!node.children.has(pathSegment)) {
                node.children.set(pathSegment, { name: pathSegment, children: new Map(), isEndOfPath: false, parent: node });
            }
            node = node.children.get(pathSegment);
        }

        node.isEndOfPath = true;
    }

    /**
     * @param {string} path - The path to find in the trie
     * @param {boolean} matchPartialPaths - Whether to return the node if the path is not found
     * @returns {object} - The node that matches the path
     */
    find(path, matchPartialPaths = false) {
        const pathSegments = path.split('/').filter(Boolean);
        let node = this.root;

        for (const pathSegment of pathSegments) {
            // early out if we have an invalid path
            const child = node.children.get(pathSegment);
            if (!child) {
                return matchPartialPaths ? node : null;
            }
            node = child;
        }

        return node;
    }

    /**
     * @param {string} path - The path to remove from the trie
     * @returns {boolean} - True if the path was removed, false otherwise
     */
    remove(path) {
        let node = this.find(path);
        if (!node || node.children.size > 0) return false;

        while (node && node.children.size === 0) {
            node.parent?.children?.delete(node.name);
            node = node.parent;
        }

        return true;
    }

    /**
     * @param {string} path - The path to search for
     * @returns {object[]} - A list of nodes that match the search path
     */
    search(path) {

        const hasTrailingSlash = path.endsWith('/');
        const lastPathSegment = path.split('/').filter(Boolean).pop();
        const node = this.find(path, true);
        const paths = Array.from(node.children.values());

        // if the search path exactly matches the requested path then we have an exact match
        if (node.name === lastPathSegment) {

            // If we have a trailing slash then return the children otherwise return the node itself
            return hasTrailingSlash ? paths : [node];
        }

        // If we don't have a trailing slash then return a list of children that start with the last path segment
        return paths.filter(({ name }) => name.startsWith(lastPathSegment));

    }
}

export { Trie };
