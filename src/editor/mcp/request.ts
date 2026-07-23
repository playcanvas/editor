type Result = { data?: unknown; error?: string; meta?: Record<string, unknown> };

const message = (err: any) => {
    if (err instanceof Error || (typeof ErrorEvent !== 'undefined' && err instanceof ErrorEvent)) {
        return err.message;
    }
    if (typeof err === 'string') {
        return err;
    }
    return String(err?.message || err?.error || err?.response?.message || err?.response?.error || JSON.stringify(err));
};

const handleRequest = async (data: string, call: (name: string, ...args: unknown[]) => Result | Promise<Result>) => {
    let id: number | undefined;
    try {
        const req = JSON.parse(data);
        id = req?.id;
        if (!Number.isInteger(id)) {
            throw new Error('Invalid request id');
        }
        if (typeof req.name !== 'string' || !req.name) {
            throw new Error('Invalid request method');
        }
        if (!Array.isArray(req.args)) {
            throw new Error('Invalid request args');
        }
        return { id, res: await call(req.name, ...req.args) };
    } catch (err) {
        const error = message(err);
        return id === undefined ? { error } : { id, res: { error } };
    }
};

export { handleRequest };
