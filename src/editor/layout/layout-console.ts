import { Button, Container, Divider, Label, Panel, Progress, TextInput } from '@playcanvas/pcui';

import { tooltip, tooltipSimpleItem } from '@/common/tooltips';
import { countToHuman, frameLimiter } from '@/common/utils';

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

const createTooltip = (target: HTMLElement, text: string) => {
    tooltip().attach({
        container: tooltipSimpleItem({
            text
        }),
        target,
        align: 'bottom'
    });
};

const createCounters = (consolePanel: { collapsed: boolean }) => {
    const counters: Record<string, { tooltip: string, el: Label }> = {
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

    // counters
    for (const key in counters) {
        const counter = counters[key];
        const label = new Label({
            class: ['count', key],
            text: '0'
        });

        // label
        label.on('click', (_e: MouseEvent) => {
            if (consolePanel.collapsed) {
                consolePanel.collapsed = false;
                return;
            }
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

const createActiveJobs = () => {
    const jobs = {};

    // jobs
    const countEl = new Label({
        class: 'jobs-count',
        text: '0 active jobs'
    });

    // progress
    const progressEl = new Progress({
        class: 'jobs-progress'
    });

    // update jobs
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

    // status job
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

const createAssetAuditor = (consolePanel) => {
    const btnAudit = new Button({
        text: '0 audits found',
        class: 'asset-auditor',
        icon: 'E348'
    });
    btnAudit.on('click', () => {
        if (consolePanel.collapsed) {
            consolePanel.collapsed = false;
            return;
        }
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

const createStatus = () => {
    const status = new Label({
        allowTextSelection: true,
        class: 'status',
        unsafe: true
    });

    // status text
    editor.method('status:text', (text: string) => {
        status.text = text;
        status.class.remove('error');
    });

    // status error
    editor.method('status:error', (text: string) => {
        status.text = text;
        status.class.add('error');
        console.error(text);
    });

    // status clear
    editor.method('status:clear', () => {
        status.text = '';
        status.class.remove('error');
    });

    return status;
};

const createHeader = () => {
    const consoleHeader = new Container({
        class: 'console-header',
        flex: true,
        flexGrow: '0',
        flexShrink: '0',
        flexBasis: 'auto',
        flexDirection: 'row'
    });

    // clear button
    const clearButton = new Label({
        class: ['icon-button', 'clear']
    });
    clearButton.on('click', () => {
        editor.call('layout:console:clear');
    });
    consoleHeader.append(clearButton);
    createTooltip(clearButton, 'Clear console');

    // copy button
    const copyButton = new Label({
        class: ['icon-button', 'copy']
    });
    copyButton.on('click', () => {
        editor.call('layout:console:copy');
    });
    consoleHeader.append(copyButton);
    createTooltip(copyButton, 'Copy console to clipboard');

    // history button
    const historyButton = new Label({
        class: ['icon-button', 'history']
    });
    historyButton.on('click', () => {
        editor.call('layout:console:history');
    });
    consoleHeader.append(historyButton);
    createTooltip(historyButton, 'View console history');

    // text filter
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

export const createConsolePanel = () => {
    const consolePanel = new Panel({
        id: 'layout-console',
        headerText: 'CONSOLE',
        height: editor.call('localStorage:get', 'editor:layout:console:height') ?? 130,
        resizeMin: 100,
        resizeMax: 512,
        resizable: 'top',
        flex: true,
        flexDirection: 'column',
        scrollable: false,
        collapsible: true,
        collapsed: editor.call('localStorage:get', 'editor:layout:console:collapse') ?? true
    });

    // disable initial transition on collapsed state
    // FIXME: Should be fixed in PCUI
    consolePanel.style.transition = 'none';
    setTimeout(() => {
        consolePanel.style.transition = '';
    });

    consolePanel.on('resize', () => {
        editor.call('localStorage:set', 'editor:layout:console:height', consolePanel.height);
    });
    consolePanel.on('collapse', () => {
        editor.call('localStorage:set', 'editor:layout:console:collapse', true);
    });
    consolePanel.on('expand', () => {
        editor.call('localStorage:set', 'editor:layout:console:collapse', false);
    });

    const statusBar = consolePanel.header;

    statusBar.append(createDivider());

    // create counters
    const counters = createCounters(consolePanel);
    Object.values(counters).forEach((counter) => {
        statusBar.append(counter.el);
    });

    const logTypes = ['info', 'warn', 'error'];

    const consoleItems: { el: Container, textEl: Label, counterEl: Label, timeEl: Label }[] = [];

    const consoleLogs: { ts: number, mask: number, msg: string, onclick: () => void }[] = [];

    let consoleFilter = '';
    let consoleTypeFlag = 0b111;

    statusBar.append(createDivider());

    // asset auditor
    statusBar.append(createAssetAuditor(consolePanel));
    statusBar.append(createDivider());

    // job status
    createActiveJobs().forEach((el) => {
        statusBar.append(el);
    });
    statusBar.append(createDivider());

    // status
    statusBar.append(createStatus());

    // header
    consolePanel.append(createHeader());

    // body
    const consoleBody = new Container({
        class: 'console-body',
        scrollable: true
    });
    consolePanel.append(consoleBody);

    const updateCounterIcons = (counts: Record<string, number>) => {
        for (const key in counters) {
            const el = counters[key].el;
            const val = counts[key];
            el.text = countToHuman(val);
            if (val > 0) {
                el.class.add('found');
            } else {
                el.class.remove('found');
            }
        }
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

        return {
            el,
            textEl,
            counterEl,
            timeEl
        };
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

    // add initial items
    const addConsoleItems = (count) => {
        for (let i = 0; i < count; i++) {
            const item = createConsoleItem();
            consoleBody.append(item.el);
            consoleItems.push(item);
        }
    };
    addConsoleItems(INITIAL_ITEM_COUNT);

    // show label
    const showLabel = new Label({
        class: 'console-show'
    });
    consoleBody.append(showLabel);
    const setShowLabel = (showing: number, total: number) => {
        showLabel.text = `Showing ${showing} of ${total} messages`;
    };
    setShowLabel(0, 0);

    // refresh entire console
    const refresh = frameLimiter((onlyCounts = false) => {
        const counts = {
            info: 0,
            warn: 0,
            error: 0
        };

        // only update counts
        if (onlyCounts) {
            // update values
            for (let i = 0; i < consoleLogs.length; i++) {
                const { mask } = consoleLogs[i];
                const type = logTypes[Math.log2(mask)];
                counts[type]++;
            }

            // update UI
            updateCounterIcons(counts);
            return;
        }

        let logIndex = 0;
        let itemIndex = 0;

        while (logIndex < consoleLogs.length) {
            const { mask, msg, onclick, ts } = consoleLogs[logIndex];
            const type = logTypes[Math.log2(mask)];
            counts[type]++;

            // if too many logs skip setting dom elements
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

            // iterate over next logs with the same type and message
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

        // hide remaining items
        for (let i = itemIndex; i < consoleItems.length; i++) {
            const { el } = consoleItems[i];
            el.hidden = true;
        }

        // show label
        setShowLabel(itemIndex, consoleLogs.length);

        // update counters
        updateCounterIcons(counts);
    });

    // bind expand
    consolePanel.on('expand', () => {
        refresh();
    });

    // bind filter
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
        refresh(consolePanel.collapsed);
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

    // error
    window.addEventListener('error', (evt: ErrorEvent) => {
        editor.call('status:error', evt.message);
    }, false);

    return consolePanel;
};
