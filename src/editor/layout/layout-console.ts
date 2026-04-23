import { Button, Container, Divider, Element, Label, Progress, TextInput } from '@playcanvas/pcui';

import { tooltip, tooltipSimpleItem } from '@/common/tooltips';
import { countToHuman, frameLimiter } from '@/common/utils';
import { config } from '@/editor/config';

const LOCALSTORAGE_KEY = 'playcanvas-editor-latest-release-notes';

const INITIAL_ITEM_COUNT = 1000;

const createDivider = () => {
    const divider = new Divider({
        class: 'divider'
    });
    divider.on('click', (e: MouseEvent) => {
        e.stopPropagation();
    });
    return divider;
};

const createTooltip = (target: Element, text: string) => {
    tooltip().attach({
        container: tooltipSimpleItem({
            text
        }),
        target,
        align: 'bottom'
    });
};

export const createCounters = () => {
    const counters: Record<string, { tooltip: string, el?: Label }> = {
        info: {
            tooltip: 'Toggle info console messages'
        },
        warn: {
            tooltip: 'Toggle warning console messages'
        },
        error: {
            tooltip: 'Toggle error console messages'
        }
    };

    for (const key in counters) {
        const counter = counters[key];
        const label = new Label({
            class: ['count', key],
            text: '0'
        });

        label.on('click', (_e: MouseEvent) => {
            if (label.class.contains('disabled')) {
                label.class.remove('disabled');
            } else {
                label.class.add('disabled');
            }
            editor.emit('layout:console:counter:change', key);
        });
        createTooltip(label, counter.tooltip);

        counter.el = label;
    }

    return counters;
};

export const createActiveJobs = () => {
    const jobs = {};

    const countEl = new Label({
        class: 'jobs-count',
        text: '0 active jobs'
    });

    const progressEl = new Progress({
        class: 'jobs-progress'
    });

    const updateJobs = function () {
        const count = Object.keys(jobs).length;
        countEl.text = `${count} active job${count === 1 ? '' : 's'}`;

        if (count > 0) {
            let least = 1;
            for (const key in jobs) {
                if (jobs[key] < least) {
                    least = jobs[key];
                }
            }
            progressEl.value = least * 100;
            progressEl.class.add('active');
        } else {
            progressEl.class.remove('active');
            progressEl.value = 0;
        }
    };

    editor.method('status:job', (id, value) => {
        if (jobs.hasOwnProperty(id) && value === undefined) {
            delete jobs[id];
        } else {
            jobs[id] = value;
        }

        updateJobs();
    });

    editor.api.globals.jobs.on('start', (id) => {
        editor.call('status:job', id, 1);
    });

    editor.api.globals.jobs.on('finish', (id: string) => {
        editor.call('status:job', id);
    });

    return [countEl, progressEl];
};

export const createAssetAuditor = () => {
    const btnAudit = new Button({
        text: '0 audits found',
        class: 'asset-auditor',
        icon: 'E348'
    });
    btnAudit.on('click', () => {
        editor.call('picker:auditor');
    });
    editor.on('assets:auditor:issues', (issues, errors) => {
        btnAudit.class.remove('error', 'warn');
        if (issues) {
            btnAudit.text = `${issues} audit${issues === 1 ? '' : 's'} found`;
            btnAudit.class.add(errors > 0 ? 'error' : 'warn');
        } else {
            btnAudit.text = '0 audits found';
        }
    });

    createTooltip(btnAudit, 'Open Asset Auditor');

    return btnAudit;
};

export const createStatus = () => {
    const status = new Label({
        allowTextSelection: true,
        class: 'status',
        unsafe: true
    });

    editor.method('status:text', (text: string) => {
        status.text = text;
        status.class.remove('error');
    });

    editor.method('status:error', (text: string) => {
        status.text = text;
        status.class.add('error');
        console.error(text);
    });

    editor.method('status:clear', () => {
        status.text = '';
        status.class.remove('error');
    });

    return status;
};

export const createVersion = () => {
    const btnVersion = new Button({
        text: `v${config.version}`,
        class: 'version',
        icon: 'E259'
    });

    const latestVersionSeen = localStorage.getItem(LOCALSTORAGE_KEY);
    if (latestVersionSeen !== config.version) {
        btnVersion.class.add('updated');
    }

    btnVersion.on('click', () => {
        btnVersion.class.remove('updated');
        localStorage.setItem(LOCALSTORAGE_KEY, config.version);
        window.open('https://github.com/playcanvas/editor/releases');
    });

    tooltip().attach({
        container: tooltipSimpleItem({ text: 'View release notes' }),
        target: btnVersion,
        align: 'bottom',
        arrowAlign: 'end'
    });

    return btnVersion;
};

export const createStatusBarItems = () => {
    const counters = createCounters();
    const auditorBtn = createAssetAuditor();
    const [jobsCount, jobsProgress] = createActiveJobs();
    const statusLabel = createStatus();
    const versionBtn = createVersion();

    return { counters, auditorBtn, jobsCount, jobsProgress, statusLabel, versionBtn, createDivider };
};

const createConsoleHeader = () => {
    const consoleHeader = new Container({
        class: 'console-header',
        flex: true,
        flexGrow: '0',
        flexShrink: '0',
        flexBasis: 'auto',
        flexDirection: 'row'
    });

    const clearButton = new Label({
        class: ['icon-button', 'clear']
    });
    clearButton.on('click', () => {
        editor.call('layout:console:clear');
    });
    consoleHeader.append(clearButton);
    createTooltip(clearButton, 'Clear console');

    const copyButton = new Label({
        class: ['icon-button', 'copy']
    });
    copyButton.on('click', () => {
        editor.call('layout:console:copy');
    });
    consoleHeader.append(copyButton);
    createTooltip(copyButton, 'Copy console to clipboard');

    const historyButton = new Label({
        class: ['icon-button', 'history']
    });
    historyButton.on('click', () => {
        editor.call('layout:console:history');
    });
    consoleHeader.append(historyButton);
    createTooltip(historyButton, 'View console history');

    const filterText = new TextInput({
        class: 'filter-text',
        placeholder: 'Filter console',
        blurOnEnter: false,
        keyChange: true
    });
    consoleHeader.append(filterText);
    filterText.on('change', () => {
        editor.emit('layout:console:filter:change', filterText.value);
    });

    return consoleHeader;
};

export const createConsoleContent = (isVisible: () => boolean, onCountersUpdate: (counts: Record<string, number>) => void) => {
    const logTypes = ['info', 'warn', 'error'];

    const consoleItems: { el: Container, textEl: Label, counterEl: Label, timeEl: Label }[] = [];
    const consoleLogs: { ts: number, mask: number, msg: string, onclick: () => void }[] = [];

    let consoleFilter = '';
    let consoleTypeFlag = 0b111;

    const header = createConsoleHeader();

    const body = new Container({
        class: 'console-body',
        scrollable: true
    });

    const updateCounterIcons = (counts: Record<string, number>) => {
        onCountersUpdate(counts);
    };

    const createConsoleItem = () => {
        const el = new Container({
            class: 'console-item',
            flex: true,
            flexDirection: 'row',
            hidden: true
        });

        const iconEl = new Label({
            class: 'console-item-icon'
        });
        el.append(iconEl);

        const textEl = new Label({
            class: 'console-item-text',
            allowTextSelection: true
        });
        el.append(textEl);

        const counterEl = new Label({
            class: ['console-item-counter'],
            allowTextSelection: true,
            hidden: true
        });
        el.append(counterEl);

        const timeEl = new Label({
            class: 'console-item-time',
            allowTextSelection: true
        });
        el.append(timeEl);

        return { el, textEl, counterEl, timeEl };
    };

    const setItemType = (el: Container, type: string) => {
        if (el.class.contains(type)) {
            return;
        }
        for (const t of logTypes) {
            el.class.remove(t);
        }
        el.class.add(type);
    };

    const setItemText = (textEl, msg, onclick) => {
        textEl.text = msg;
        textEl.unbind('click');
        textEl.on('click', onclick);
        textEl.class.remove('link');
        if (onclick) {
            if (!textEl.class.contains('link')) {
                textEl.class.add('link');
            }
        } else {
            textEl.class.remove('link');
        }
    };

    const setItemCount = (counterEl, count) => {
        counterEl.hidden = count < 2;
        counterEl.text = count;
    };

    const setItemDate = (timeEl, ts) => {
        timeEl.text = new Date(ts).toLocaleTimeString();
    };

    const addConsoleItems = (count) => {
        for (let i = 0; i < count; i++) {
            const item = createConsoleItem();
            body.append(item.el);
            consoleItems.push(item);
        }
    };
    addConsoleItems(INITIAL_ITEM_COUNT);

    const showLabel = new Label({
        class: 'console-show'
    });
    body.append(showLabel);
    const setShowLabel = (showing: number, total: number) => {
        showLabel.text = `Showing ${showing} of ${total} messages`;
    };
    setShowLabel(0, 0);

    const refresh = frameLimiter((onlyCounts = false) => {
        const counts = {
            info: 0,
            warn: 0,
            error: 0
        };

        if (onlyCounts) {
            for (let i = 0; i < consoleLogs.length; i++) {
                const { mask } = consoleLogs[i];
                const type = logTypes[Math.log2(mask)];
                counts[type]++;
            }
            updateCounterIcons(counts);
            return;
        }

        let logIndex = 0;
        let itemIndex = 0;

        while (logIndex < consoleLogs.length) {
            const { mask, msg, onclick, ts } = consoleLogs[logIndex];
            const type = logTypes[Math.log2(mask)];
            counts[type]++;

            if (itemIndex >= consoleItems.length) {
                logIndex++;
                continue;
            }

            const { el, textEl, counterEl, timeEl } = consoleItems[itemIndex];
            let refCount = 1;

            const matchText = !msg || msg.toLowerCase().includes(consoleFilter);
            const matchFlag = consoleTypeFlag & (1 << logTypes.indexOf(type));

            if (!matchText || !matchFlag) {
                logIndex++;
                continue;
            }

            el.hidden = false;

            setItemType(el, type);
            setItemText(textEl, msg, onclick);
            setItemCount(counterEl, countToHuman(refCount));
            setItemDate(timeEl, ts);

            logIndex++;

            let next = consoleLogs[logIndex];
            while (next && next.mask === mask && next.msg === msg) {
                const { mask, msg, onclick, ts } = next;
                const type = logTypes[Math.log2(mask)];
                counts[type]++;

                setItemText(textEl, msg, onclick);
                setItemCount(counterEl, countToHuman(++refCount));
                setItemDate(timeEl, ts);

                logIndex++;
                next = consoleLogs[logIndex];
            }

            itemIndex++;
        }

        for (let i = itemIndex; i < consoleItems.length; i++) {
            consoleItems[i].el.hidden = true;
        }

        setShowLabel(itemIndex, consoleLogs.length);
        updateCounterIcons(counts);
    });

    editor.on('layout:console:filter:change', (text) => {
        consoleFilter = text.trim().toLowerCase();
        refresh();
    });
    editor.on('layout:console:counter:change', (type) => {
        consoleTypeFlag ^= 1 << logTypes.indexOf(type);
        refresh();
    });

    editor.method('layout:console:add', (ts, type, msg, onclick) => {
        consoleLogs.push({
            ts,
            mask: 1 << logTypes.indexOf(type),
            msg,
            onclick
        });
        refresh(!isVisible());
    });
    editor.method('layout:console:clear', () => {
        consoleLogs.length = 0;
        refresh();
    });
    editor.method('layout:console:copy', () => {
        const copy = consoleLogs.map(({ ts, mask, msg }) => {
            const type = logTypes[Math.log2(mask)];
            const time = new Date(ts).toLocaleString().replace(', ', '|');
            return `[${time}] [${type[0]}] ${msg}`;
        }).join('\n');
        navigator.clipboard.writeText(copy);
        editor.call('status:text', 'Console copied to clipboard');
    });
    editor.method('layout:console:history', () => {
        editor.call('console:history');
    });

    window.addEventListener('error', (evt: ErrorEvent) => {
        editor.call('status:error', evt.message);
    }, false);

    return { header, body, refresh };
};
