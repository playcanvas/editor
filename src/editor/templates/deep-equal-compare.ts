type Node = Record<string, unknown>;
type NullDefault = (path: string[]) => boolean;
type FixedDefault = (path: string[]) => { value: unknown } | null;
type Catalog = {
    isNullDefault: (root: unknown, path: string[]) => boolean;
    resolvePath: (root: unknown, path: string[]) => { default: unknown; hasDefault: boolean; open: boolean } | null;
};

const isMapObj = (obj: unknown): boolean => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
};

class DeepEqual {
    node1: unknown;

    node2: unknown;

    bothNodes: unknown[];

    nullDefault?: NullDefault;

    fixedDefault?: FixedDefault;

    path: string[];

    constructor(
        node1: unknown,
        node2: unknown,
        nullDefault?: NullDefault,
        path: string[] = [],
        fixedDefault?: FixedDefault
    ) {
        this.node1 = node1;

        this.node2 = node2;

        this.bothNodes = [node1, node2];

        this.nullDefault = nullDefault;

        this.fixedDefault = fixedDefault;

        this.path = path;
    }

    run(): boolean {
        if (this.node1 === this.node2) {
            return true;
        }
        if (this.isNullish(this.node1) && this.isNullish(this.node2) && this.nullDefault?.(this.path)) {
            return true;
        }
        if ((this.node1 === undefined) !== (this.node2 === undefined)) {
            return this.isAbsentDefault();
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

    // an absent field reads as its fixed schema default, which the editor fills in on load
    isAbsentDefault(): boolean {
        const def = this.fixedDefault?.(this.path);
        return !!def && new DeepEqual(this.node1 ?? this.node2, def.value).run();
    }

    handleMaps(): boolean {
        const n1 = this.node1 as Node;
        const n2 = this.node2 as Node;
        const keys = new Set([...Object.keys(n1), ...Object.keys(n2)]);
        return [...keys].every((k) => {
            return new DeepEqual(n1[k], n2[k], this.nullDefault, this.path.concat(k), this.fixedDefault).run();
        });
    }

    handleArrays(): boolean {
        const a1 = this.node1 as unknown[];
        const a2 = this.node2 as unknown[];
        const sameLen = a1.length === a2.length;
        return (
            sameLen &&
            a1.every((v1, index) => {
                return new DeepEqual(
                    v1,
                    a2[index],
                    this.nullDefault,
                    this.path.concat(String(index)),
                    this.fixedDefault
                ).run();
            })
        );
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
 * @param nullDefault - Returns whether null and absence are equivalent at a path
 * @param fixedDefault - Returns the default an absent value is equivalent to at a path
 * @returns True if the nodes are deep-equal
 */
export const isDeepEqual = (
    node1: unknown,
    node2: unknown,
    nullDefault?: NullDefault,
    fixedDefault?: FixedDefault
): boolean => {
    return new DeepEqual(node1, node2, nullDefault, [], fixedDefault).run();
};

export const isSchemaDeepEqual = (node1: unknown, node2: unknown, schema: Catalog, root: unknown, path: string[]) => {
    return isDeepEqual(
        node1,
        node2,
        (child) => schema.isNullDefault(root, path.concat(child)),
        (child) => {
            const resolved = schema.resolvePath(root, path.concat(child));
            return resolved && !resolved.open && resolved.hasDefault ? { value: resolved.default } : null;
        }
    );
};
