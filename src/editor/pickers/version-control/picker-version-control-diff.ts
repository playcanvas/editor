import { Button, Container, Overlay, Panel, TreeView, TreeViewItem } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { buildNameIndex, indexTemplateEntities, valueKind, type NameIndex } from './vc-diff-data';
import { createValueField, destroyValueFields } from './vc-diff-fields';
import {
    assetDiffField,
    diffTextChangeCounts,
    formatDiffPath,
    hashChip,
    isHiddenDiffField,
    lineChangeCounts,
    splitDiffPath,
    summarizeDiff,
    typeLabel
} from './vc-helpers';

const SUB_RE = /^(?<kind>Script|Sound slot|Clip): (?<name>.+)$/;
const SETTINGS_ROOT_RE = /^(?:scene |project )?settings$/i;

// entity-level template-instance fields get their own (collapsed) panel rather
// than sitting among the entity's regular values; values are shown friendlier
const TEMPLATE_PANEL = 'Template instance';
const TEMPLATE_FIELDS: Record<string, string> = { template_id: 'Source template', template_ent_ids: 'Entity mapping' };

// loading-state skeleton fragments (mirror the real diff layout: sidebar rows are
// name + status badge; main panels are a header bar over field rows of label + value)
const SKELETON_ROW = '<div class="skeleton-row"><span class="bone line"></span><span class="bone badge"></span></div>';
const SKELETON_FIELD = '<div class="skeleton-field"><span class="bone label"></span><span class="bone value"></span></div>';
const SKELETON_PANEL = `<div class="skeleton-panel"><div class="skeleton-phead"><span class="bone line"></span></div>${SKELETON_FIELD.repeat(3)}</div>`;

editor.once('load', () => {
    if (config.project.settings.useLegacyScripts) {
        return;
    }

    const root = editor.call('layout.root');
    const overlay = new Overlay({ class: 'vc-diff-overlay', clickable: false, hidden: true });
    root.append(overlay);

    const shell = new Container({ class: 'vc-diff-shell' });
    overlay.append(shell);

    const top = new Container({ class: 'vc-diff-top' });
    shell.append(top);

    const title = document.createElement('div');
    title.classList.add('vc-diff-title');
    title.textContent = 'Diff';
    top.dom.appendChild(title);

    const meta = document.createElement('div');
    meta.classList.add('vc-diff-meta');
    top.dom.appendChild(meta);

    const close = new Button({ icon: 'E132', class: 'vc-diff-close' });
    close.on('click', () => {
        overlay.hidden = true;
    });
    top.append(close);

    const body = new Container({ class: 'vc-diff-body' });
    shell.append(body);

    const sidebar = document.createElement('div');
    sidebar.classList.add('vc-diff-sidebar');
    body.dom.appendChild(sidebar);

    const main = document.createElement('div');
    main.classList.add('vc-diff-main');
    body.dom.appendChild(main);

    let current: any = null;
    let nameIndex: NameIndex = null;
    let selected = 0;
    let viewToken = 0;
    let trees: TreeView[] = [];
    const fileStats = new Map<string, Promise<{ deleted: number; added: number } | null>>();

    sidebar.addEventListener('click', (evt) => {
        const row = (evt.target as HTMLElement).closest('.vc-diff-row') as HTMLElement;
        if (!row?.dataset.index) {
            return;
        }
        selected = Number(row.dataset.index);
        sidebar.querySelectorAll('.vc-diff-row.selected').forEach(el => el.classList.remove('selected'));
        row.classList.add('selected');
        renderMain();
    });

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;

    const isRetainedDiff = (id: string) => {
        return !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);
    };

    const statusFor = (conflict: any) => {
        const entry = conflict?.data?.[0] ?? {};
        const whole = !entry.path;
        return whole && entry.missingInDst ? 'added' : whole && entry.missingInSrc ? 'deleted' : 'modified';
    };

    const textEntry = (conflict: any) => (conflict?.data ?? []).find((entry: any) => entry.isTextualMerge || entry.mergedFilePath);

    const propertyEntries = (conflict: any) => (conflict?.data ?? []).filter((entry: any) => !entry.isTextualMerge && !entry.mergedFilePath && !isHiddenDiffField(entry.path));

    const selectedConflict = () => current?.conflicts?.[selected] ?? null;

    const lineStats = (counts: { deleted: number; added: number } | null) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-stats');
        const add = document.createElement('span');
        add.classList.add('new');
        add.textContent = counts ? `+${counts.added}` : '+...';
        el.appendChild(add);
        el.appendChild(document.createTextNode(' '));
        const del = document.createElement('span');
        del.classList.add('old');
        del.textContent = counts ? `-${counts.deleted}` : '-...';
        el.appendChild(del);
        return el;
    };

    const propertyStats = (entries: any[]) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-property-count');
        el.textContent = `${entries.length} field${entries.length === 1 ? '' : 's'}`;
        return el;
    };

    const localTextCounts = (entry: any) => {
        if (entry.missingInDst) {
            return lineChangeCounts(entry.srcValue ?? '', '');
        }
        if (entry.missingInSrc) {
            return lineChangeCounts('', entry.dstValue ?? '');
        }
        return lineChangeCounts(entry.srcValue, entry.dstValue);
    };

    const loadTextCounts = (entry: any) => {
        const id = diffId(current);
        if (!id || !entry?.id || !entry?.mergedFilePath) {
            return Promise.resolve(null);
        }
        const key = JSON.stringify([id, entry.id, entry.mergedFilePath]);
        if (!fileStats.has(key)) {
            fileStats.set(key, editor.api.globals.rest.merge.mergeConflicts({
                mergeId: id,
                conflictId: entry.id,
                fileName: entry.mergedFilePath,
                resolved: false
            }).promisify()
            .then(diffTextChangeCounts)
            .catch((err: unknown) => {
                log.error(err);
                return null;
            }));
        }
        return fileStats.get(key)!;
    };

    const entityName = (conflict: any, value: string) => {
        const id = splitDiffPath(value)[1];
        const src = current?.srcCheckpoint?.scenes?.[conflict.itemId]?.entities?.[id];
        const dst = current?.dstCheckpoint?.scenes?.[conflict.itemId]?.entities?.[id];
        const name = src ?? dst;
        return typeof name === 'string' ? name : nameIndex?.entity.get(id);
    };

    const appendBadge = (parent: HTMLElement, status: string) => {
        const badge = document.createElement('span');
        badge.classList.add('status', status);
        badge.textContent = status;
        parent.appendChild(badge);
        return badge;
    };

    const typeFor = (entry: any, side: 'src' | 'dst') => entry[`${side}Type`] ?? entry.type ?? '';

    const sectionComponent = (value: string) => value.match(/^(.+) component$/i)?.[1]?.replace(/\s+/g, '').toLowerCase() ?? '';

    const inspectorInfo = (conflict: any, entry: any) => {
        // template assets carry a scene-shaped entity tree under data.entities;
        // strip the prefix and render it exactly like a scene
        const tpl = conflict.assetType === 'template' && entry.path?.startsWith('data.entities.');
        const path = tpl ? entry.path.slice('data.'.length) : entry.path;
        const type = tpl ? 'scene' : conflict.itemType;
        const raw = entry.path || conflict.itemName;
        // generic asset property diffs: humanise data.opacityDither -> "Opacity
        // Dither" and group under the asset-type panel, like the inspector
        if (!tpl && type === 'asset' && path) {
            const a = assetDiffField(conflict.assetType, path);
            return { entityContext: [], section: a.section, context: [], field: a.field, title: a.title, type: '' };
        }
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
        // entity-level template-instance plumbing routes to its own panel
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

    // section routing for one entry: which panel, which sub-panel, which label
    const sectionParts = (conflict: any, entry: any) => {
        const info = inspectorInfo(conflict, entry);
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

    // entity breadcrumb as a real (inert) pcui treeview, like the hierarchy panel
    const entityTree = (label: { text: string; title?: string }, compType: string) => {
        const parts = label.text.replace(/^Entity:\s*/, '').split('/').filter(Boolean);
        const tree = new TreeView({ allowDrag: false, allowReordering: false });
        tree.class.add('vc-diff-entity-tree', 'entities-treeview');
        let parent: TreeView | TreeViewItem = tree;
        parts.forEach((name, i) => {
            const leaf = i === parts.length - 1;
            const item = new TreeViewItem({ text: name, allowDrag: false, allowSelect: false, open: !leaf });
            item.iconLabel.class.add('component-icon-postfix');
            if (leaf) {
                if (compType) {
                    item.iconLabel.class.add(`type-${compType}`);
                }
                item.dom.querySelector('.pcui-treeview-item-contents')?.classList.add('pcui-treeview-item-selected');
            }
            parent.append(item);
            parent = item;
        });
        tree.dom.title = label.title ?? label.text;
        trees.push(tree);
        return tree;
    };

    // note: NOT 'vc-diff-row' — that class belongs to the sidebar buttons and their click delegation
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

    // entities.<guid>.children (scenes) / data.entities.<guid>.children (templates)
    const isEntityChildren = (path: string) => {
        const parts = splitDiffPath(path ?? '');
        const e = parts[0] === 'data' ? parts.slice(1) : parts;
        return e.length === 3 && e[0] === 'entities' && e[2] === 'children';
    };

    const sideField = (entry: any, side: 'src' | 'dst') => {
        const value = side === 'src' ? entry.srcValue : entry.dstValue;
        const missing = side === 'src' ? entry.missingInSrc : entry.missingInDst;
        // a template's source id is an asset reference — show it as the asset name
        if (!missing && splitDiffPath(entry.path ?? '').pop() === 'template_id') {
            return createValueField('asset', value, nameIndex);
        }
        // an asset's folder path is a variable-length list of folder ids; render
        // it as a folder chip list (a move resizes it), not a fixed-size vector
        if (!missing && entry.path === 'path' && Array.isArray(value)) {
            return createValueField('array:asset', value, nameIndex);
        }
        // an entity's children is a list of entity ids — resolve them to leaf names
        if (!missing && isEntityChildren(entry.path) && Array.isArray(value)) {
            return createValueField('children', value, nameIndex);
        }
        const kind = missing ? 'missing' : valueKind(typeFor(entry, side), entry.path ?? '', value);
        return createValueField(kind, value, nameIndex);
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

    // banner for whole-item adds/deletes (entries without a path)
    const wholeBanner = (conflict: any, entry: any, noun: string) => {
        const banner = document.createElement('div');
        banner.classList.add('vc-diff-banner');
        const status = entry.missingInDst ? 'added' : entry.missingInSrc ? 'deleted' : 'modified';
        appendBadge(banner, status);
        const text = document.createElement('span');
        text.textContent = `This ${noun} was ${status} since the checkpoint`;
        banner.appendChild(text);
        return banner;
    };

    const renderUnifiedDiff = (conflict: any, entries: any[]) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-diff-inspector');

        // one card per entity (its breadcrumb shown once); the entity's panels
        // stack inside, so an entity changed across several sections (e.g.
        // Entity + Template instance) isn't redrawn as separate repeated parts
        let card: { entity: string; dom: HTMLElement } = null;
        let section: { name: string; panel: Panel; subs: Map<string, Panel> } = null;
        const hostDom = (parts: { sub: string; panel: string }) => {
            if (!parts.sub) {
                return section.panel.content.dom;
            }
            if (!section.subs.has(parts.sub)) {
                const sub = new Panel({ collapsible: true, headerText: parts.sub });
                sub.class.add('vc-diff-subpanel');
                // script/slot/clip sub-panels are inset like the inspector's;
                // settings group sub-panels are flush like the settings panel's
                if (parts.panel !== 'Settings') {
                    sub.class.add('inset');
                }
                section.panel.append(sub);
                section.subs.set(parts.sub, sub);
            }
            return section.subs.get(parts.sub)!.content.dom;
        };

        for (const entry of entries) {
            const parts = sectionParts(conflict, entry);
            const entityKey = parts.entity?.title ?? parts.entity?.text ?? '';
            if (!card || card.entity !== entityKey) {
                const dom = document.createElement('div');
                dom.classList.add('vc-diff-section');
                if (parts.entity) {
                    dom.appendChild(entityTree(parts.entity, parts.icon).dom);
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
                host.appendChild(wholeBanner(conflict, entry, entry.path ? 'entity' : conflict.assetType ?? conflict.itemType ?? 'item'));
                continue;
            }
            // children: show only the added/removed entries, not the whole
            // before+after lists (the unchanged siblings are just noise)
            if (isEntityChildren(entry.path) && Array.isArray(entry.srcValue) && Array.isArray(entry.dstValue)) {
                const src = new Set(entry.srcValue);
                const dst = new Set(entry.dstValue);
                const removed = entry.dstValue.filter((id: string) => !src.has(id));
                const added = entry.srcValue.filter((id: string) => !dst.has(id));
                if (removed.length) {
                    host.appendChild(fieldRow('del', parts.field, parts.title, createValueField('children', removed, nameIndex)));
                }
                if (added.length) {
                    host.appendChild(fieldRow('add', parts.field, parts.title, createValueField('children', added, nameIndex)));
                }
                if (!removed.length && !added.length) {
                    // same members, different order — note it without re-listing every child
                    const note = document.createElement('span');
                    note.classList.add('vc-diff-missing');
                    note.textContent = `reordered (${entry.srcValue.length} item${entry.srcValue.length === 1 ? '' : 's'})`;
                    host.appendChild(fieldRow('add', parts.field, parts.title, note));
                }
                continue;
            }
            if (!entry.missingInDst) {
                host.appendChild(fieldRow('del', parts.field, parts.title, sideField(entry, 'dst')));
            }
            if (!entry.missingInSrc) {
                host.appendChild(fieldRow('add', parts.field, parts.title, sideField(entry, 'src')));
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

    const renderIframe = (conflict: any, entry: any) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-diff-frame-wrap');

        const loading = document.createElement('div');
        loading.classList.add('vc-diff-loading');
        loading.textContent = 'Loading file diff';
        wrap.appendChild(loading);

        const frame = document.createElement('iframe');
        frame.classList.add('vc-diff-frame');
        frame.addEventListener('load', () => {
            loading.hidden = true;
        });
        const params = new URLSearchParams({
            mergeId: `${diffId(current) ?? ''}`,
            conflictId: `${entry.id}`,
            assetType: `${conflict.assetType ?? ''}`,
            mergedFilePath: `${entry.mergedFilePath}`
        });
        frame.src = `/editor/code/${config.project.id}?${params.toString()}`;
        wrap.appendChild(frame);
        return wrap;
    };

    const updateCounts = (el: HTMLElement, entry: any, token: number) => {
        loadTextCounts(entry).then((file) => {
            if (token !== viewToken || !el.isConnected) {
                return;
            }
            el.innerHTML = '';
            el.appendChild(lineStats(file ?? localTextCounts(entry) ?? { added: 0, deleted: 0 }));
        });
    };

    const appendSummaryStats = (parent: HTMLElement, text: any, props: any[]) => {
        if (text?.id && text?.mergedFilePath) {
            parent.appendChild(lineStats(null));
            updateCounts(parent, text, viewToken);
        } else if (text) {
            parent.appendChild(lineStats(localTextCounts(text) ?? { added: 0, deleted: 0 }));
        } else if (props.length) {
            parent.appendChild(propertyStats(props));
        }
    };

    const renderSidebar = () => {
        sidebar.innerHTML = '';
        const summary = summarizeDiff(current ?? {});
        const head = document.createElement('div');
        head.classList.add('vc-diff-sidebar-head');
        head.textContent = `${summary.total} change${summary.total === 1 ? '' : 's'}`;
        sidebar.appendChild(head);

        for (const group of summary.groups) {
            const groupHead = document.createElement('div');
            groupHead.classList.add('vc-diff-group');
            groupHead.textContent = `${typeLabel(group.type)} · ${group.items.length}`;
            sidebar.appendChild(groupHead);

            for (const item of group.items) {
                const conflict = current.conflicts[item.index];
                const row = document.createElement('button');
                row.type = 'button';
                row.classList.add('vc-diff-row');
                row.dataset.index = `${item.index}`;
                if (item.index === selected) {
                    row.classList.add('selected');
                }

                const name = document.createElement('span');
                name.classList.add('name');
                name.textContent = item.name;
                name.title = item.name;
                row.appendChild(name);

                const sub = document.createElement('span');
                sub.classList.add('sub');
                const count = (conflict?.data ?? []).filter((e: any) => !isHiddenDiffField(e.path)).length;
                sub.textContent = `${conflict?.assetType ?? conflict?.itemType ?? group.type} · ${count} change${count === 1 ? '' : 's'}`;
                row.appendChild(sub);

                const counts = document.createElement('span');
                counts.classList.add('counts');
                const props = propertyEntries(conflict);
                const text = textEntry(conflict);
                appendSummaryStats(counts, text, props);
                row.appendChild(counts);

                appendBadge(row, item.status);
                sidebar.appendChild(row);
            }
        }
    };

    const renderMain = () => {
        trees.forEach(t => t.destroy());
        trees = [];
        destroyValueFields(main);
        main.innerHTML = '';
        const conflict = selectedConflict();
        if (!conflict) {
            const empty = document.createElement('div');
            empty.classList.add('vc-diff-empty');
            empty.textContent = 'Select a change to view its diff';
            main.appendChild(empty);
            return;
        }

        const text = textEntry(conflict);
        const props = propertyEntries(conflict);
        const header = document.createElement('div');
        header.classList.add('vc-diff-detail-head');

        const name = document.createElement('div');
        name.classList.add('name');
        name.textContent = conflict.itemName === 'project settings' ? 'Project Settings' : conflict.itemName;
        name.title = name.textContent;
        header.appendChild(name);

        appendBadge(header, statusFor(conflict));

        const stats = document.createElement('div');
        stats.classList.add('stats');
        appendSummaryStats(stats, text, props);
        header.appendChild(stats);
        main.appendChild(header);

        const detail = document.createElement('div');
        detail.classList.add('vc-diff-detail');
        const showText = text?.id && text?.mergedFilePath;
        if (showText) {
            detail.classList.add('has-frame');
        }
        if (props.length) {
            detail.appendChild(renderUnifiedDiff(conflict, props));
        }
        if (showText) {
            detail.appendChild(renderIframe(conflict, text));
        } else if (!props.length) {
            const empty = document.createElement('div');
            empty.classList.add('vc-diff-empty');
            empty.textContent = 'No preview available';
            detail.appendChild(empty);
        }
        main.appendChild(detail);
    };

    const render = () => {
        viewToken++;
        const summary = summarizeDiff(current ?? {});
        const base = current?.destinationCheckpointId || current?.dstCheckpointId;
        meta.textContent = `${summary.total} change${summary.total === 1 ? '' : 's'}`;
        if (typeof base === 'string') {
            meta.appendChild(document.createTextNode(' · vs '));
            meta.appendChild(hashChip(base));
        }
        renderSidebar();
        renderMain();
    };

    const cleanup = () => {
        viewToken++;
        sidebar.innerHTML = '';
        trees.forEach(t => t.destroy());
        trees = [];
        destroyValueFields(main);
        main.innerHTML = '';
        fileStats.clear();
    };

    // mouse/browser back closes the diff, mirroring how the scene picker is
    // dismissed by the same history navigation (see the scenes-load popstate)
    let closingViaBack = false;
    const onPopState = () => {
        if (!overlay.hidden) {
            closingViaBack = true;
            overlay.hidden = true;
        }
    };

    overlay.on('show', () => {
        editor.emit('picker:open', 'version-control-diff');
        window.addEventListener('popstate', onPopState);
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    overlay.on('hide', () => {
        window.removeEventListener('popstate', onPopState);
        const id = diffId(current);
        if (typeof id === 'string' && !isRetainedDiff(id)) {
            editor.emit('picker:diffManager:closed', id);
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: id }), () => {});
        }
        if (closingViaBack) {
            // the scene-router back already closed/navigated the picker beneath the
            // diff; only clear its suspended state (set in presentDiff) so it's
            // interactive again when reopened — resume is a no-op if not suspended
            editor.call('picker:project:resume');
        } else {
            if (editor.call('picker:isOpen', 'project')) {
                editor.call('picker:project:resume');
            } else {
                editor.call('picker:versioncontrol');
            }
            editor.call('vcgraph:moveToForeground');
        }
        closingViaBack = false;
        current = null;
        nameIndex = null;
        selected = 0;
        cleanup();
        editor.emit('picker:close', 'version-control-diff');
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    editor.on('viewport:hover', (state: boolean) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // single-line message in the main area (loading / empty / error states)
    const renderNotice = (message: string) => {
        trees.forEach(t => t.destroy());
        trees = [];
        destroyValueFields(main);
        main.innerHTML = '';
        const notice = document.createElement('div');
        notice.classList.add('vc-diff-empty');
        notice.textContent = message;
        main.appendChild(notice);
    };

    const renderLoading = () => {
        trees.forEach(t => t.destroy());
        trees = [];
        destroyValueFields(main);
        meta.textContent = '';
        sidebar.innerHTML = `<div class="vc-diff-skeleton">${SKELETON_ROW.repeat(6)}</div>`;
        main.innerHTML = `<div class="vc-diff-skeleton main"><div class="skeleton-head"><span class="bone title"></span><span class="bone badge"></span></div>${SKELETON_PANEL.repeat(2)}</div>`;
    };

    const setDiff = (diff: any) => {
        current = diff;
        nameIndex = buildNameIndex(current ?? {});
        // template assets carry their own entity tree; resolve its names too
        indexTemplateEntities(nameIndex, current?.conflicts ?? [], (id: any) => editor.call('assets:get', id));
        const summary = summarizeDiff(current ?? {});
        if (!summary.total) {
            meta.textContent = 'No changes';
            sidebar.innerHTML = '';
            renderNotice('No changes since the checkpoint');
            return;
        }
        selected = summary.groups[0]?.items[0]?.index ?? 0;
        render();
    };

    // accepts a resolved diff or a Promise that resolves to one; a pending diff
    // opens the overlay immediately with a loading state (viewToken guards stale opens)
    editor.method('picker:versioncontrol:diffPicker', (input: any) => {
        const token = ++viewToken;
        current = null;
        nameIndex = null;
        selected = 0;
        overlay.hidden = false;
        if (input && typeof input.then === 'function') {
            renderLoading();
            input.then((diff: any) => {
                if (token === viewToken) {
                    setDiff(diff);
                }
            }).catch((err: any) => {
                if (token === viewToken) {
                    meta.textContent = '';
                    sidebar.innerHTML = '';
                    renderNotice(`Could not load diff: ${err instanceof Error ? err.message : err}`);
                }
            });
        } else {
            setDiff(input);
        }
    });
});
