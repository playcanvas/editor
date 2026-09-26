// regenerates expected.json from the pipeline's own template-instance logic
// usage: MONOREPO=/path/to/monorepo node gen.mjs --env test
import { readFileSync, writeFileSync } from 'node:fs';

const base = `${process.env.MONOREPO}/pipeline/shared/base/templates`;
const { default: Create } = await import(`${base}/merge/create-instance-entities.js`);
const { default: Prep } = await import(`${base}/remap/prep-template-conflicts.js`);

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/g;
const { template, scriptAttrs } = JSON.parse(readFileSync(new URL('./template.json', import.meta.url), 'utf8'));

// same steps as entities-task.js + add-instance-handler.js for a plain instantiate
const res = new Create(Object.values(template.entities)).run();
const cons = new Prep([], res.dstEnts, res.srcToDst, res.root.resource_id, scriptAttrs, false).run();
cons.filter(c => c.path === 'children').forEach((c) => {
    res.dstIdToEnt[c.resource_id].children = c.src_value;
});
res.root.parent = 'PARENT';
res.root.template_ent_ids = res.dstToSrc;
res.root.template_id = template.id;
res.root.name = template.name;

// swap generated guids for @src / +key tokens
const { added_for_tid_field: extra = {}, ...srcToDst } = res.srcToDst;
const tok = {};
for (const k in srcToDst) tok[srcToDst[k]] = `@${k}`;
for (const k in extra) tok[extra[k]] = `+${k}`;
const out = JSON.parse(JSON.stringify(res.dstIdToEnt).replace(UUID, id => tok[id] || id));

// one entity per line
const lines = Object.keys(out).map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(out[k])}`);
writeFileSync(new URL('./expected.json', import.meta.url), `{\n${lines.join(',\n')}\n}\n`);

// shared-libs opens connections on import
process.exit(0);
