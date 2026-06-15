import { Button, Container, Overlay, Panel, TreeView, TreeViewItem } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import { buildNameIndex, valueKind, type NameIndex } from './vc-diff-data';
import { createValueField, destroyValueFields } from './vc-diff-fields';
import {
    diffTextChangeCounts,
    formatDiffPath,
    hashChip,
    lineChangeCounts,
    splitDiffPath,
    summarizeDiff,
    typeLabel
} from './vc-helpers';

const SUB_RE = /^(?<kind>Script|Sound slot|Clip): (?<name>.+)$/;
const SETTINGS_ROOT_RE = /^(?:scene |project )?settings$/i;

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

    const propertyEntries = (conflict: any) => (conflict?.data ?? []).filter((entry: any) => !entry.isTextualMerge && !entry.mergedFilePath);

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
        const raw = entry.path || conflict.itemName;
        if (!entry.path || (conflict.itemType !== 'scene' && conflict.itemType !== 'settings')) {
            return {
                entityContext: [],
                section: typeLabel(conflict.itemType ?? 'item'),
                context: [],
                field: raw,
                title: raw,
                type: sectionComponent(typeLabel(conflict.itemType ?? 'item'))
            };
        }

        const info = formatDiffPath(entry.path, conflict.itemType, entityName(conflict, entry.path));
        const labels = info.labels;
        const entity = labels.find(label => label.text.startsWith('Entity: '));
        const comp = labels.findIndex(label => label.text.endsWith(' component'));
        let entityContext = [];
        let section = labels[0]?.text ?? typeLabel(conflict.itemType);
        let context = labels.slice(0, -1);

        if (comp >= 0) {
            section = labels[comp].text;
            entityContext = entity ? [entity] : [];
            context = labels.slice(comp + 1);
        } else if (labels[0]?.text === 'Scene settings' && labels[1]) {
            section = labels[1].text;
            context = labels.slice(2);
        } else if (conflict.itemType === 'settings') {
            section = labels[0]?.text ?? 'Project settings';
            context = labels.slice(1);
        } else if (entity) {
            section = 'Entity';
            entityContext = [entity];
            context = labels.filter(label => label !== entity);
        }

        return {
            entityContext,
            section,
            context,
            field: info.field || raw,
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

    const sideField = (entry: any, side: 'src' | 'dst') => {
        const value = side === 'src' ? entry.srcValue : entry.dstValue;
        const missing = side === 'src' ? entry.missingInSrc : entry.missingInDst;
        const kind = missing ? 'missing' : valueKind(typeFor(entry, side), entry.path ?? '', value);
        return createValueField(kind, value, nameIndex);
    };

    // wholly added/deleted entities arrive as a missing-flagged entry at the entity root
    const wholeEntity = (entry: any) => {
        if (!entry.missingInSrc && !entry.missingInDst) {
            return false;
        }
        const parts = splitDiffPath(entry.path ?? '');
        return parts.length === 2 && parts[0] === 'entities';
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

        let section: { key: string; panel: Panel; subs: Map<string, Panel> } = null;
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
            const key = JSON.stringify([parts.entity?.title ?? parts.entity?.text ?? '', parts.panel]);
            if (section?.key !== key) {
                const card = document.createElement('div');
                card.classList.add('vc-diff-section');
                if (parts.entity) {
                    card.appendChild(entityTree(parts.entity, parts.icon).dom);
                }
                const panel = new Panel({ collapsible: true, headerText: parts.panel });
                panel.class.add('vc-diff-panel');
                if (parts.icon) {
                    const icon = document.createElement('span');
                    icon.classList.add('component-icon', `type-${parts.icon}`);
                    panel.header.dom.insertBefore(icon, panel.header.dom.querySelector('.pcui-panel-header-title'));
                }
                card.appendChild(panel.dom);
                wrap.appendChild(card);
                section = { key, panel, subs: new Map() };
            }
            const host = hostDom(parts);
            if (!entry.path || wholeEntity(entry)) {
                host.appendChild(wholeBanner(conflict, entry, entry.path ? 'entity' : conflict.assetType ?? conflict.itemType ?? 'item'));
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
                const count = conflict?.data?.length ?? 0;
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

    overlay.on('show', () => {
        editor.emit('picker:open', 'version-control-diff');
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    overlay.on('hide', () => {
        const id = diffId(current);
        if (typeof id === 'string' && !isRetainedDiff(id)) {
            editor.emit('picker:diffManager:closed', id);
            handleCallback(editor.api.globals.rest.merge.mergeDelete({ mergeId: id }), () => {});
        }
        if (editor.call('picker:isOpen', 'project')) {
            editor.call('picker:project:resume');
        } else {
            editor.call('picker:versioncontrol');
        }
        editor.call('vcgraph:moveToForeground');
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
        meta.textContent = 'Computing changes…';
        sidebar.innerHTML = `<div class="vc-skeleton">${'<div class="skeleton-row"><span class="bone line"></span></div>'.repeat(6)}</div>`;
        renderNotice('Computing changes…');
    };

    const setDiff = (diff: any) => {
        current = diff;
        nameIndex = buildNameIndex(current ?? {});
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
