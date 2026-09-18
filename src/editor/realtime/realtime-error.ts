// server-side schema validation rejects a bad op via ShareDB, which forwards the
// verdict to the client as an error message prefixed `invalid:` (e.g. `invalid:value`,
// `invalid:exception: <detail>`). the op is reverted but the connection stays healthy.

const text = (err: unknown) =>
    typeof err === 'string' ? err : ((err as { message?: string })?.message ?? String(err ?? ''));

const isSchemaRejection = (err: unknown) => /^invalid:/.test(text(err));

const schemaRejectionMessage = (err: unknown) => {
    const reason =
        text(err)
            .replace(/^invalid:\s*/, '')
            .trim() || 'invalid change';
    return `A change was rejected by the server and reverted (${reason}). See the browser console for details.`;
};

export { isSchemaRejection, schemaRejectionMessage };
