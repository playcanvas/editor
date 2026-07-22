const api = editor.api.globals;

const log = (msg: string) => console.log(`[MCP] ${msg}`);

/**
 * PlayCanvas REST API wrapper.
 *
 * @param method - The HTTP method to use.
 * @param path - The path to the API endpoint.
 * @param data - The data to send.
 * @param auth - Whether to send the access token.
 * @returns The parsed JSON response.
 */
const rest = (method: string, path: string, data?: FormData | object, auth = false) => {
    const headers: Record<string, string> = {};
    if (auth) {
        headers.Authorization = `Bearer ${api.accessToken}`;
    }
    const init: RequestInit = { method, headers };
    if (data instanceof FormData) {
        init.body = data;
    } else if (data) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(data);
    }
    return fetch(`/api/${path}`, init).then((res) => res.json());
};

/**
 * @param obj - The object to iterate.
 * @param callback - Called with the dot path and value of each leaf.
 * @param currentPath - The current path prefix.
 */
const iterateObject = (obj: Record<string, any>, callback: (path: string, value: any) => void, currentPath = '') => {
    Object.entries(obj).forEach(([key, value]) => {
        const path = currentPath ? `${currentPath}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            iterateObject(value, callback, path);
        } else {
            callback(path, value);
        }
    });
};

/**
 * Build a human-readable hierarchy path for an entity (e.g. `Root/Player/Camera`).
 * This resolves the otherwise opaque UUID chain into semantic context.
 *
 * @param entity - The entity API instance.
 * @returns The slash-separated path from the root to the entity.
 */
const entityPath = (entity: any) => {
    const names = [];
    let current = entity;
    const seen = new Set();
    while (current && !seen.has(current.get('resource_id'))) {
        seen.add(current.get('resource_id'));
        names.unshift(current.get('name'));
        const parentId = current.get('parent');
        current = parentId ? api.entities.get(parentId) : null;
    }
    return names.join('/');
};

/**
 * Produce the compact, semantic summary returned by list/create/modify tools.
 * Returning this inline after mutations lets agents skip a follow-up
 * `list_entities` round-trip.
 *
 * @param entity - The entity API instance.
 * @returns The entity summary.
 */
const entitySummary = (entity: any) => {
    const components = entity.get('components') || {};
    return {
        resource_id: entity.get('resource_id'),
        name: entity.get('name'),
        path: entityPath(entity),
        parent: entity.get('parent'),
        enabled: entity.get('enabled'),
        tags: entity.get('tags') || [],
        components: Object.keys(components)
    };
};

/**
 * Apply limit/offset pagination to a list and return the page plus the pagination
 * metadata that belongs in the response envelope.
 *
 * @param items - The full result set.
 * @param options - Pagination options (`limit` default 50, `offset` default 0).
 * @returns The page and pagination meta.
 */
const paginate = <T>(items: T[], options: { limit?: number; offset?: number } = {}) => {
    const total = items.length;
    const limit = Number.isFinite(options.limit) ? Math.max(0, options.limit!) : 50;
    const offset = Number.isFinite(options.offset) ? Math.max(0, options.offset!) : 0;
    const page = limit > 0 ? items.slice(offset, offset + limit) : items.slice(offset);
    const end = offset + page.length;
    const hasMore = end < total;
    return {
        page,
        meta: {
            total,
            count: page.length,
            hasMore,
            nextCursor: hasMore ? String(end) : null
        }
    };
};

export { api, log, rest, iterateObject, entitySummary, paginate };
