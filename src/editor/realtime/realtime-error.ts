// server-side schema validation rejects a bad op via ShareDB, which forwards the
// verdict to the client as an error message prefixed `invalid:` (e.g. `invalid:value`,
// `invalid:exception: <detail>`). the op is reverted but the connection stays healthy.

type OpComponent = { p: (string | number)[]; [key: string]: unknown };

const text = (err: unknown) =>
    typeof err === 'string' ? err : ((err as { message?: string })?.message ?? String(err ?? ''));

const isSchemaRejection = (err: unknown) => /^invalid:/.test(text(err));

const reasonOf = (err: unknown) =>
    text(err)
        .replace(/^invalid:\s*/, '')
        .trim() || 'invalid change';

const schemaRejectionMessage = (err: unknown) => {
    return `A change was rejected by the server and reverted (${reasonOf(err)}). See the browser console for details.`;
};

const verbOf = (c: OpComponent) =>
    'oi' in c ? 'set' : 'od' in c ? 'delete' : 'li' in c || 'ld' in c || 'lm' in c ? 'update the list' : 'edit';

// the op can bundle parent-creation components, so point at the one the verdict names
const culprit = (reason: string, op: OpComponent[]) =>
    (reason === 'delete' ? op.find((c) => 'od' in c && !('oi' in c)) : undefined) ?? op[op.length - 1];

// `<<...>>` parts only appear in the verbose log
const refusal = (reason: string, c: OpComponent, path: string, subject?: string) =>
    `Server refused to ${verbOf(c)} ${[path, subject].filter(Boolean).join(' on ')}, change reverted<< (invalid:${reason})>>`;

/**
 * Describes which part of a rejected scene op the server refused, and the entity it targets.
 */
const sceneRejection = (err: unknown, op: OpComponent[], nameOf: (id: string) => string | undefined) => {
    const reason = reasonOf(err);
    const c = culprit(reason, op);
    const [root, id, ...rest] = c.p;
    const entity = root === 'entities' && id !== undefined ? String(id) : undefined;
    const subject = entity && `${nameOf(entity) ?? 'entity'}<< (${entity})>>`;
    return { entity, msg: refusal(reason, c, entity ? rest.join('.') : c.p.join('.'), subject) };
};

/**
 * Describes which part of a rejected asset or settings op the server refused.
 */
const docRejection = (err: unknown, op: OpComponent[], subject: string) => {
    const reason = reasonOf(err);
    const c = culprit(reason, op);
    return refusal(reason, c, c.p.join('.'), subject);
};

const SETTINGS_LABELS: Record<string, string> = {
    project: 'project settings',
    projectUser: 'project user settings',
    projectPrivate: 'private project settings',
    user: 'user settings'
};

/**
 * Describes which setting the server refused, labelled by the settings doc it lives in.
 */
const settingsRejection = (err: unknown, op: OpComponent[], name: string) =>
    docRejection(err, op, SETTINGS_LABELS[name] ?? `${name} settings`);

// a failed pipeline job reports its verdict on the `job.update` payload; returns the
// user-facing message when that verdict is a schema rejection, else null
const jobRejectionMessage = (data: { job?: { error?: unknown } }) => {
    const err = data?.job?.error;
    return isSchemaRejection(err) ? schemaRejectionMessage(err) : null;
};

export {
    isSchemaRejection,
    schemaRejectionMessage,
    sceneRejection,
    docRejection,
    settingsRejection,
    jobRejectionMessage
};
export type { OpComponent };
