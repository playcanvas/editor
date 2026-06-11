import { Button, Container, Overlay } from '@playcanvas/pcui';

import { handleCallback } from '@/common/utils';
import { config } from '@/editor/config';

import {
    diffTextChangeCounts,
    formatDiffPath,
    lineChangeCounts,
    splitDiffPath,
    summarizeDiff,
    typeLabel
} from './vc-helpers';

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
    let selected = 0;
    let viewToken = 0;
    const fileStats = new Map<string, Promise<{ deleted: number; added: number } | null>>();

    sidebar.addEventListener('click', (evt) => {
        const row = (evt.target as HTMLElement).closest('.vc-diff-row') as HTMLElement;
        if (!row?.dataset.index) {
            return;
        }
        selected = Number(row.dataset.index);
        render();
    });

    const diffId = (diff: any) => diff?.id ?? diff?.merge_id;

    const isRetainedDiff = (id: string) => {
        return !!id && !!editor.call('picker:versioncontrol:hasRetainedDiff', id);
    };

    const fmtVal = (v: any) => {
        if (v === undefined || v === null) {
            return 'null';
        }
        const s = typeof v === 'string' ? `"${v}"` : JSON.stringify(v);
        return s.length > 160 ? `${s.substring(0, 157)}...` : s;
    };

    const statusFor = (conflict: any) => {
        const entry = conflict?.data?.[0] ?? {};
        return entry.missingInDst ? 'added' : entry.missingInSrc ? 'deleted' : 'modified';
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

    const loadTextCounts = (conflict: any, entry: any) => {
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
        return typeof name === 'string' ? name : undefined;
    };

    const appendBadge = (parent: HTMLElement, status: string) => {
        const badge = document.createElement('span');
        badge.classList.add('status', status);
        badge.textContent = status;
        parent.appendChild(badge);
        return badge;
    };

    const typeFor = (entry: any, side: 'src' | 'dst') => entry[`${side}Type`] ?? entry.type ?? '';

    const num = (v: number) => {
        return Number.isInteger(v) ? `${v}` : `${Number(v.toFixed(4))}`;
    };

    const looksColor = (type: string, path: string, value: any) => {
        const p = path.toLowerCase();
        return (type === 'rgb' || type === 'rgba' || p.includes('color') || p.includes('tint')) &&
            Array.isArray(value) && value.length >= 3 && value.length <= 4 && value.every((n: unknown) => typeof n === 'number');
    };

    const looksCurve = (type: string, value: any) => {
        return type === 'curve' || type === 'curveset' || !!value?.keys || !!value?.[0]?.keys;
    };

    const renderMissing = (text: string) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-rendered', 'missing');
        el.textContent = text;
        return el;
    };

    const renderBool = (value: boolean) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-rendered', 'boolean');
        el.title = value ? 'true' : 'false';
        const box = document.createElement('span');
        box.classList.add('box');
        if (value) {
            box.classList.add('checked');
        }
        el.appendChild(box);
        return el;
    };

    const renderColor = (value: number[]) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-rendered', 'color');
        const swatch = document.createElement('span');
        swatch.classList.add('swatch');
        const rgba = [value[0], value[1], value[2], value[3] ?? 1];
        swatch.style.backgroundColor = `rgba(${rgba.map((n, i) => {
            return i < 3 ? Math.round(n * 255) : n;
        }).join(', ')})`;
        el.appendChild(swatch);
        const label = document.createElement('span');
        label.textContent = value.map(num).join(', ');
        el.appendChild(label);
        return el;
    };

    const renderVector = (value: number[]) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-rendered', 'vector');
        const keys = ['x', 'y', 'z', 'w'];
        value.forEach((v, i) => {
            const chip = document.createElement('span');
            chip.classList.add('chip');
            chip.textContent = `${keys[i] ?? i}: ${num(v)}`;
            el.appendChild(chip);
        });
        return el;
    };

    const curveSets = (value: any) => {
        const raw = Array.isArray(value) && value[0]?.keys ? value : [value];
        return raw.flatMap((curve: any) => {
            const keys = curve?.keys;
            if (!Array.isArray(keys)) {
                return [];
            }
            return Array.isArray(keys[0]) ? keys : [keys];
        });
    };

    const renderCurve = (value: any) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-rendered', 'curve');
        const canvas = document.createElement('canvas');
        canvas.width = 140;
        canvas.height = 32;
        el.appendChild(canvas);
        const sets = curveSets(value);
        const vals = sets.flatMap((keys: number[]) => keys.filter((_, i) => i % 2 === 1));
        const min = Math.min(...vals, 0);
        const max = Math.max(...vals, 1);
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height - 1);
            ctx.lineTo(canvas.width, canvas.height - 1);
            ctx.stroke();
            ['#6da8ff', '#8fe59e', '#f3c16f', '#ff8a8a'].forEach((color, i) => {
                const keys = sets[i];
                if (!keys?.length) {
                    return;
                }
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let j = 0; j < keys.length; j += 2) {
                    const x = Math.max(0, Math.min(1, keys[j])) * canvas.width;
                    const y = canvas.height - ((keys[j + 1] - min) / Math.max(0.0001, max - min)) * canvas.height;
                    if (j === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            });
        }
        const label = document.createElement('span');
        label.textContent = `${sets.length || 1} curve${sets.length === 1 ? '' : 's'}`;
        el.appendChild(label);
        return el;
    };

    const renderJson = (value: any) => {
        const el = document.createElement('span');
        el.classList.add('vc-diff-rendered', 'json');
        el.textContent = fmtVal(value);
        return el;
    };

    const renderValue = (entry: any, side: 'src' | 'dst', value: any) => {
        const type = typeFor(entry, side);
        if (value === undefined) {
            return renderMissing('not available');
        }
        if (value === null) {
            return renderMissing('null');
        }
        if (typeof value === 'boolean') {
            return renderBool(value);
        }
        if (looksCurve(type, value)) {
            return renderCurve(value);
        }
        if (looksColor(type, entry.path ?? '', value)) {
            return renderColor(value);
        }
        if (Array.isArray(value) && value.length >= 2 && value.length <= 4 && value.every(v => typeof v === 'number')) {
            return renderVector(value);
        }
        if (typeof value === 'number') {
            const el = document.createElement('span');
            el.classList.add('vc-diff-rendered', 'number');
            el.textContent = num(value);
            return el;
        }
        if (typeof value === 'string') {
            const el = document.createElement('span');
            el.classList.add('vc-diff-rendered', 'string');
            if (value === '') {
                el.classList.add('empty');
                el.textContent = '""';
                el.title = 'empty string';
            } else {
                el.textContent = value;
            }
            return el;
        }
        return renderJson(value);
    };

    const sectionComponent = (value: string) => value.match(/^(.+) component$/i)?.[1]?.replace(/\s+/g, '').toLowerCase() ?? '';

    const sectionTitle = (value: string) => value.replace(/ component$/i, '').toUpperCase();

    const inspectorInfo = (conflict: any, entry: any) => {
        const raw = entry.path || conflict.itemName;
        if (!entry.path || (conflict.itemType !== 'scene' && conflict.itemType !== 'settings')) {
            return {
                entityContext: [],
                section: sectionTitle(typeLabel(conflict.itemType ?? 'item')),
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
            section: sectionTitle(section),
            context,
            field: info.field || raw,
            title: `${labels.map(label => label.text).join(' / ')} / ${info.field || raw}`,
            type: sectionComponent(section)
        };
    };

    const appendEntityTree = (parent: HTMLElement, label: { text: string; title?: string }) => {
        const value = label.text.replace(/^Entity:\s*/, '');
        const parts = value.split('/').filter(Boolean);
        if (parts.length < 2) {
            return false;
        }

        const tree = document.createElement('div');
        tree.classList.add('vc-diff-entity-tree', 'entities-treeview');
        tree.title = label.title ?? value;

        parts.forEach((part, i) => {
            const item = document.createElement('div');
            item.classList.add('tree-item', 'pcui-treeview-item');
            if (i === parts.length - 1) {
                item.classList.add('current');
            }
            const row = document.createElement('div');
            row.classList.add('tree-row', 'pcui-treeview-item-contents');
            row.style.paddingLeft = `${Math.min(i, 8) * 24}px`;
            const toggle = document.createElement('span');
            toggle.classList.add('tree-toggle');
            toggle.textContent = i === parts.length - 1 ? '' : '-';
            row.appendChild(toggle);
            const dot = document.createElement('span');
            dot.classList.add('tree-dot');
            row.appendChild(dot);
            const icon = document.createElement('span');
            icon.classList.add('tree-icon', 'component-icon-postfix');
            if (i === parts.length - 1) {
                icon.classList.add('type-element');
            }
            row.appendChild(icon);
            const name = document.createElement('span');
            name.classList.add('tree-name', 'pcui-treeview-item-text');
            name.textContent = part;
            row.appendChild(name);
            item.appendChild(row);
            tree.appendChild(item);
        });

        parent.appendChild(tree);
        return true;
    };

    const appendInspectorContext = (parent: HTMLElement, context: { text: string; title?: string }[], kind = '') => {
        if (!context.length) {
            return;
        }
        const wrap = document.createElement('div');
        wrap.classList.add('vc-diff-inspector-context');
        if (kind) {
            wrap.classList.add(kind);
        }
        context.forEach((label) => {
            if (label.text.startsWith('Entity: ') && appendEntityTree(wrap, label)) {
                return;
            }
            const line = document.createElement('div');
            line.classList.add('context-line');
            line.textContent = label.text;
            line.title = label.title ?? label.text;
            wrap.appendChild(line);
        });
        parent.appendChild(wrap);
    };

    const renderSideValue = (entry: any, kind: string) => {
        if (kind === 'old') {
            return entry.missingInDst ? renderMissing('not present') : renderValue(entry, 'dst', entry.dstValue);
        }
        return entry.missingInSrc ? renderMissing('removed') : renderValue(entry, 'src', entry.srcValue);
    };

    const renderInspectorSide = (conflict: any, entries: any[], kind: string) => {
        const side = document.createElement('div');
        side.classList.add('vc-diff-inspector-side', kind);

        const head = document.createElement('div');
        head.classList.add('vc-diff-inspector-title');
        head.textContent = kind === 'old' ? 'Before' : 'After';
        side.appendChild(head);

        let key = '';
        let body: HTMLElement = null;
        for (const entry of entries) {
            const info = inspectorInfo(conflict, entry);
            const nextKey = JSON.stringify([info.entityContext.map(label => label.text), info.section, info.context.map(label => label.text)]);
            if (nextKey !== key || !body) {
                key = nextKey;
                const section = document.createElement('section');
                section.classList.add('vc-diff-inspector-section');

                appendInspectorContext(section, info.entityContext, 'entity');

                const sectionHead = document.createElement('div');
                sectionHead.classList.add('vc-diff-inspector-section-head');
                const icon = document.createElement('span');
                icon.classList.add('component-icon');
                if (info.type) {
                    icon.classList.add(`type-${info.type}`);
                }
                sectionHead.appendChild(icon);
                const text = document.createElement('span');
                text.textContent = info.section;
                sectionHead.appendChild(text);
                section.appendChild(sectionHead);
                appendInspectorContext(section, info.context);

                body = document.createElement('div');
                body.classList.add('vc-diff-inspector-section-body');
                section.appendChild(body);
                side.appendChild(section);
            }

            const row = document.createElement('div');
            row.classList.add('vc-diff-inspector-row', kind);
            row.title = info.title;

            const label = document.createElement('div');
            label.classList.add('label');
            label.textContent = info.field;
            row.appendChild(label);

            const value = document.createElement('div');
            value.classList.add('value');
            value.appendChild(renderSideValue(entry, kind));
            row.appendChild(value);
            body.appendChild(row);
        }

        return side;
    };

    const renderPropertyDiff = (conflict: any, entries: any[]) => {
        const wrap = document.createElement('div');
        wrap.classList.add('vc-diff-inspector');

        if (!entries.length) {
            const empty = document.createElement('div');
            empty.classList.add('vc-diff-empty');
            empty.textContent = 'No property changes';
            wrap.appendChild(empty);
            return wrap;
        }

        wrap.appendChild(renderInspectorSide(conflict, entries, 'old'));
        wrap.appendChild(renderInspectorSide(conflict, entries, 'new'));
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

    const updateCounts = (el: HTMLElement, conflict: any, entry: any, token: number) => {
        loadTextCounts(conflict, entry).then((file) => {
            if (token !== viewToken || !el.isConnected) {
                return;
            }
            el.innerHTML = '';
            el.appendChild(lineStats(file ?? localTextCounts(entry) ?? { added: 0, deleted: 0 }));
        });
    };

    const appendSummaryStats = (parent: HTMLElement, conflict: any, text: any, props: any[]) => {
        if (text?.id && text?.mergedFilePath) {
            parent.appendChild(lineStats(null));
            updateCounts(parent, conflict, text, viewToken);
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
                appendSummaryStats(counts, conflict, text, props);
                row.appendChild(counts);

                appendBadge(row, item.status);
                sidebar.appendChild(row);
            }
        }
    };

    const renderMain = () => {
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
        appendSummaryStats(stats, conflict, text, props);
        header.appendChild(stats);
        main.appendChild(header);

        const detail = document.createElement('div');
        detail.classList.add('vc-diff-detail');
        const showText = text?.id && text?.mergedFilePath;
        if (showText) {
            detail.classList.add('has-frame');
        }
        if (props.length) {
            detail.appendChild(renderPropertyDiff(conflict, props));
        }
        if (showText) {
            detail.appendChild(renderIframe(conflict, text));
            const token = viewToken;
            loadTextCounts(conflict, text).then((counts) => {
                if (token !== viewToken || !stats.isConnected) {
                    return;
                }
                stats.innerHTML = '';
                stats.appendChild(lineStats(counts ?? localTextCounts(text) ?? { added: 0, deleted: 0 }));
            });
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
        meta.textContent = `${summary.total} change${summary.total === 1 ? '' : 's'}${typeof base === 'string' ? ` · vs ${base.substring(0, 7)}` : ''}`;
        renderSidebar();
        renderMain();
    };

    const cleanup = () => {
        viewToken++;
        sidebar.innerHTML = '';
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

    editor.method('picker:versioncontrol:diffPicker', (diff: any) => {
        current = diff;
        const summary = summarizeDiff(current ?? {});
        selected = summary.groups[0]?.items[0]?.index ?? 0;
        render();
        overlay.hidden = false;
    });
});
