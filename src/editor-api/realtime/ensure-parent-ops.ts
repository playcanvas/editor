type Op = { p: (string | number)[]; oi?: unknown; li?: unknown; [key: string]: unknown };

/**
 * Prepend ops that create any ancestor container missing from the backend
 * snapshot, so a nested insert never references a parent the document lacks.
 *
 * The observer creates missing intermediate objects locally without emitting
 * an op, so a leaf `set` (e.g. `components.model.mapping.5`) can produce a
 * ShareDB op whose parent (`mapping`) is undefined server-side and is rejected
 * by json0 with "Referenced element not an object". Walking the real snapshot
 * lets us create the container first, keeping leaf writes intact.
 *
 * @param data - The authoritative ShareDB snapshot for the document
 * @param op - The operation about to be submitted
 * @returns The op preceded by any required container-create ops
 */
export const ensureParentOps = (data: unknown, op: Op): Op[] => {
    // only inserts reference a container that must already exist
    if (op.oi === undefined && op.li === undefined) {
        return [op];
    }

    const ops: Op[] = [];
    let node: unknown = data;
    const last = op.p.length - 1;

    for (let i = 0; i < last; i++) {
        const key = op.p[i];
        const parent = node as Record<PropertyKey, unknown> | null | undefined;
        if (parent != null && parent[key] !== undefined) {
            node = parent[key];
            continue;
        }

        // this ancestor (and everything below it) is absent on the backend;
        // the immediate parent of a list insert must itself be an array
        const list = op.li !== undefined && i === last - 1;
        ops.push({ p: op.p.slice(0, i + 1), oi: list ? [] : {} });
        node = undefined;
    }

    ops.push(op);
    return ops;
};

export type { Op };
