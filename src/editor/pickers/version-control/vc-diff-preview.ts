import { Panel } from '@playcanvas/pcui';

import { isEntityIdMap } from './vc-diff-data';
import { formatDiffPath, splitDiffPath, typeLabel } from './vc-helpers';

// compact, text-valued mirror of the full diff's structured renderer
// (picker-version-control-diff.ts). kept separate so the shipped full diff
// stays untouched; the routing below intentionally tracks that file.

const SUB_RE = /^(?<kind>Script|Sound slot|Clip): (?<name>.+)$/;
const SETTINGS_ROOT_RE = /^(?:scene |project )?settings$/i;

// entity-level template-instance fields route to their own collapsed panel
const TEMPLATE_PANEL = 'Template instance';
const TEMPLATE_FIELDS: Record<string, string> = { template_id: 'Source template', template_ent_ids: 'Entity mapping' };

type EntityName = (conflict: any, value: string) => string | undefined;

const sectionComponent = (value: string) => value.match(/^(.+) component$/i)?.[1]?.replace(/\s+/g, '').toLowerCase() ?? '';

// entities.<guid>.children (scenes) / data.entities.<guid>.children (templates)
const isEntityChildren = (path: string) => {
    const parts = splitDiffPath(path ?? '');
    const e = parts[0] === 'data' ? parts.slice(1) : parts;
    return e.length === 3 && e[0] === 'entities' && e[2] === 'children';
};

const inspectorInfo = (conflict: any, entry: any, entityName: EntityName) => {
    // template assets carry a scene-shaped entity tree under data.entities;
    // strip the prefix and render it exactly like a scene
    const tpl = conflict.assetType === 'template' && entry.path?.startsWith('data.entities.');
    const path = tpl ? entry.path.slice('data.'.length) : entry.path;
    const type = tpl ? 'scene' : conflict.itemType;
    const raw = entry.path || conflict.itemName;
    if (!path || (type !== 'scene' && type !== 'settings')) {
        return {
            entityContext: [],
            section: typeLabel(conflict.itemType ?? 'item'),
            context: [],
            field: raw,
            title: raw,
            type: sectionComponent(typeLabel(conflict.itemType ?? 'item'))
        };
    }

    const info = formatDiffPath(path, type, entityName(conflict, path));
    const labels = info.labels;
    const entity = labels.find(label => label.text.startsWith('Entity: '));
    const comp = labels.findIndex(label => label.text.endsWith(' component'));
    const tplField = TEMPLATE_FIELDS[splitDiffPath(path).pop() ?? ''];
    let entityContext = [];
    let section = labels[0]?.text ?? typeLabel(type);
    let context = labels.slice(0, -1);

    if (comp >= 0) {
        section = labels[comp].text;
        entityContext = entity ? [entity] : [];
        context = labels.slice(comp + 1);
    } else if (labels[0]?.text === 'Scene settings' && labels[1]) {
        section = labels[1].text;
        context = labels.slice(2);
    } else if (type === 'settings') {
        section = labels[0]?.text ?? 'Project settings';
        context = labels.slice(1);
    } else if (entity) {
        section = tplField ? TEMPLATE_PANEL : 'Entity';
        entityContext = [entity];
        context = labels.filter(label => label !== entity);
    }

    return {
        entityContext,
        section,
        context,
        field: tplField ?? info.field ?? raw,
        title: `${labels.map(label => label.text).join(' / ')} / ${info.field || raw}`,
        type: sectionComponent(section)
    };
};

const sectionParts = (conflict: any, entry: any, entityName: EntityName) => {
    const info = inspectorInfo(conflict, entry, entityName);
    const isSettings = conflict.itemType === 'settings' ||
        (conflict.itemType === 'scene' && splitDiffPath(entry.path ?? '')[0] === 'settings');
    if (isSettings) {
        const sub = SETTINGS_ROOT_RE.test(info.section) ? '' :
            [info.section, ...info.context.map(label => label.text)].join(' · ');
        return { entity: null, panel: 'Settings', icon: '', sub, field: info.field, title: info.title };
    }
    const subMatch = info.context[0]?.text.match(SUB_RE);
    // the inspector shows raw (unprettified) script attribute names
    const field = subMatch?.groups?.kind === 'Script' ? (splitDiffPath(entry.path ?? '').pop() ?? info.field) : info.field;
    return {
        entity: info.entityContext[0] ?? null,
        panel: info.section.replace(/ component$/i, ''),
        icon: info.type,
        sub: subMatch?.groups?.name ?? '',
        field,
        title: info.title
    };
};

// wholly added/deleted entities arrive as a missing-flagged entry at the entity root
const wholeEntity = (entry: any) => {
    if (!entry.missingInSrc && !entry.missingInDst) {
        return false;
    }
    // templates prefix the path with `data.`; normalise so a whole template
    // entity (data.entities.<guid>) reads like a scene's (entities.<guid>)
    const parts = splitDiffPath(entry.path ?? '');
    const e = parts[0] === 'data' ? parts.slice(1) : parts;
    return e.length === 2 && e[0] === 'entities';
};

const fieldRow = (kind: 'del' | 'add', label: string, title: string, valueEl: HTMLElement) => {
    const row = document.createElement('div');
    row.classList.add('vc-diff-field-row', kind);
    row.title = title;
    const gut = document.createElement('span');
    gut.classList.add('gutter');
    gut.textContent = kind === 'del' ? '−' : '+';
    row.appendChild(gut);
    const lbl = document.createElement('span');
    lbl.classList.add('label');
    lbl.textContent = label;
    row.appendChild(lbl);
    const val = document.createElement('span');
    val.classList.add('value');
    val.appendChild(valueEl);
    row.appendChild(val);
    return row;
};

const banner = (status: string, noun: string) => {
    const el = document.createElement('div');
    el.classList.add('vc-diff-banner');
    const badge = document.createElement('span');
    badge.classList.add('status', status);
    badge.textContent = status;
    el.appendChild(badge);
    const text = document.createElement('span');
    text.textContent = `This ${noun} was ${status} since the checkpoint`;
    el.appendChild(text);
    return el;
};

// structured property diff for the changes-tab preview: same markup/classes as
// the full diff, but a text breadcrumb instead of a live tree and string values
export const renderPreviewPropertyDiff = (
    conflict: any,
    entries: any[],
    helpers: { entityName: EntityName; fmtVal: (v: any) => string }
) => {
    const { entityName, fmtVal } = helpers;
    const wrap = document.createElement('div');
    wrap.classList.add('vc-diff-inspector', 'compact');

    const valueCell = (entry: any, side: 'src' | 'dst') => {
        const value = side === 'src' ? entry.srcValue : entry.dstValue;
        const missing = side === 'src' ? entry.missingInSrc : entry.missingInDst;
        const span = document.createElement('span');
        if (missing) {
            span.classList.add('vc-diff-missing');
            span.textContent = '(none)';
        } else if (isEntityIdMap(value)) {
            // compact summary in the preview; the full diff resolves names
            const n = Object.keys(value).length;
            span.textContent = `${n} entit${n === 1 ? 'y' : 'ies'}`;
            span.title = JSON.stringify(value, null, 2);
        } else if (isEntityChildren(entry.path) && Array.isArray(value)) {
            // compact summary; the full diff resolves these ids to named chips
            const n = value.length;
            span.textContent = `${n} child${n === 1 ? '' : 'ren'}`;
            span.title = JSON.stringify(value, null, 2);
        } else {
            span.textContent = fmtVal(value);
            // fmtVal truncates to 64 chars; hover shows the full value
            span.title = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return span;
    };

    // one card per entity (breadcrumb shown once); panels stack inside so an
    // entity changed across sections isn't drawn as separate repeated parts
    let card: { entity: string; dom: HTMLElement } = null;
    let section: { name: string; panel: Panel; subs: Map<string, Panel> } = null;
    const hostDom = (parts: { sub: string; panel: string }) => {
        if (!parts.sub) {
            return section.panel.content.dom;
        }
        if (!section.subs.has(parts.sub)) {
            const sub = new Panel({ collapsible: true, headerText: parts.sub });
            sub.class.add('vc-diff-subpanel');
            if (parts.panel !== 'Settings') {
                sub.class.add('inset');
            }
            section.panel.append(sub);
            section.subs.set(parts.sub, sub);
        }
        return section.subs.get(parts.sub)!.content.dom;
    };

    for (const entry of entries) {
        const parts = sectionParts(conflict, entry, entityName);
        const entityKey = parts.entity?.title ?? parts.entity?.text ?? '';
        if (!card || card.entity !== entityKey) {
            const dom = document.createElement('div');
            dom.classList.add('vc-diff-section');
            if (parts.entity) {
                const crumb = document.createElement('div');
                crumb.classList.add('vc-diff-crumb');
                crumb.textContent = parts.entity.text.replace(/^Entity:\s*/, '').split('/').filter(Boolean).join(' / ');
                crumb.title = parts.entity.title ?? parts.entity.text;
                dom.appendChild(crumb);
            }
            wrap.appendChild(dom);
            card = { entity: entityKey, dom };
            section = null;
        }
        if (!section || section.name !== parts.panel) {
            const panel = new Panel({ collapsible: true, headerText: parts.panel });
            panel.class.add('vc-diff-panel');
            if (parts.icon) {
                const icon = document.createElement('span');
                icon.classList.add('component-icon', `type-${parts.icon}`);
                panel.header.dom.insertBefore(icon, panel.header.dom.querySelector('.pcui-panel-header-title'));
            }
            card.dom.appendChild(panel.dom);
            section = { name: parts.panel, panel, subs: new Map() };
        }
        const host = hostDom(parts);
        if (!entry.path || wholeEntity(entry)) {
            const status = entry.missingInDst ? 'added' : entry.missingInSrc ? 'deleted' : 'modified';
            host.appendChild(banner(status, entry.path ? 'entity' : conflict.assetType ?? conflict.itemType ?? 'item'));
            continue;
        }
        if (!entry.missingInDst) {
            host.appendChild(fieldRow('del', parts.field, parts.title, valueCell(entry, 'dst')));
        }
        if (!entry.missingInSrc) {
            host.appendChild(fieldRow('add', parts.field, parts.title, valueCell(entry, 'src')));
        }
    }

    if (!entries.length) {
        const empty = document.createElement('div');
        empty.classList.add('vc-diff-empty');
        empty.textContent = 'No property changes';
        wrap.appendChild(empty);
    }
    return wrap;
};
