const TYPES: Record<string, string> = { name: 'string', description: 'string', private: 'boolean', owner: 'string' };

const ALLOWED = {
    create: ['name', 'description', 'private', 'owner'],
    update: ['name', 'description', 'private']
};

const valid = (key: string, value: unknown) => typeof value === TYPES[key];

/**
 * Picks the project fields an agent may set over MCP. Anything else (forks, settings, images,
 * tags, ...) is rejected by name rather than silently dropped.
 *
 * @param input - The tool input.
 * @param mode - Whether the fields are for a new project or an update.
 * @returns The accepted fields, or an error.
 */
const pickProjectFields = (input: Record<string, unknown> | null | undefined, mode: 'create' | 'update') => {
    const allowed = ALLOWED[mode];
    const entries = Object.entries(input ?? {}).filter(([, value]) => value !== undefined);

    const rejected = entries.filter(([key]) => !allowed.includes(key)).map(([key]) => key);
    if (rejected.length) {
        return { error: `Unsupported project field(s): ${rejected.join(', ')}. Allowed: ${allowed.join(', ')}.` };
    }

    const invalid = entries.filter(([key, value]) => !valid(key, value)).map(([key]) => key);
    if (invalid.length) {
        return {
            error: `Invalid project field(s): ${invalid.map((key) => `${key} (expected ${TYPES[key]})`).join(', ')}.`
        };
    }

    const fields: Record<string, unknown> = Object.fromEntries(entries);
    if (typeof fields.name === 'string' && !fields.name.trim()) {
        return { error: 'Project name cannot be empty.' };
    }
    if (mode === 'create' && fields.name === undefined) {
        return { error: 'Project name is required.' };
    }
    if (mode === 'update' && !entries.length) {
        return { error: `Provide at least one of: ${allowed.join(', ')}.` };
    }
    return { fields };
};

export { pickProjectFields };
