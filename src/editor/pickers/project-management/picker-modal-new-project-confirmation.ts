import { Container, Label } from '@playcanvas/pcui';

import { backend } from '@/common/backend';
import { projectExport } from '@/editor/messenger/jobs';

import { button } from './components/button';
import { dialog } from './components/dialog';
import { openProject } from './tabs';

const REPORT_LIMIT = 50;

editor.once('load', () => {
    // GLOBAL VARIABLES
    let projectId;

    // a backend with one project keeps the new one aside until it is opened, which deletes the current
    // one, along with any earlier one its storage set aside
    let aside = false;
    const replaceText = () =>
        `This browser holds one project at a time. Opening the new one deletes your current project${aside ? ' and the earlier one set aside' : ''}, which can't be undone. To keep a copy, export your current project first.`;
    editor.on('messenger:sandbox.storage', (data: { aside: boolean }) => {
        aside = data.aside;
    });

    // UI

    const HEADER = 'PROJECT READY';
    const { overlay, panel, footer } = dialog({ title: HEADER, class: 'picker-modal-confirmation', confirm: true });

    // confirmation message
    // projects open in their own tab, so opening one never closes what's open here
    const readyText = 'Your new project is ready. It opens in a new tab.';
    const confirmationMessage = new Label({ text: readyText });
    panel.append(confirmationMessage);

    // what an import had to change, e.g. materials it adjusted
    const report = new Container({ class: 'import-report', hidden: true });
    panel.append(report);

    // export button, so the current project can be kept before it is replaced. with one project, the
    // current and new projects share its id
    const exportButton = button({ kind: 'secondary', text: 'Export current project', hidden: true });
    footer.append(exportButton);

    exportButton.on('click', () => {
        exportButton.enabled = false;
        exportButton.text = 'Exporting...';
        projectExport({ projectId })
            .then((url) => window.open(url, '_blank'))
            .catch((err: unknown) => console.error('project export failed', err))
            .finally(() => {
                exportButton.enabled = true;
                exportButton.text = 'Export current project';
            });
    });

    // continue button
    const continueButton = button({ kind: 'secondary', text: 'Not now' });
    footer.append(continueButton);

    continueButton.on('click', () => {
        returnToCMS();
    });

    // open project button
    const openProjectButton = button({ kind: 'primary', text: 'Open project' });
    footer.append(openProjectButton);

    // the project opens in its own tab while the click allows it. with one project, opening replaces
    // the current one, and the backend then moves every editor tab to it
    openProjectButton.on('click', () => {
        overlay.hidden = true;
        openProject(projectId);
        if (!backend().multipleProjects) {
            editor.call('projects:openStaged', projectId);
        }
    });

    // CONTROLLERS

    // helper method to close current panel and return to CMS
    const returnToCMS = () => {
        overlay.hidden = true;
    };

    // method to display panel
    // a null project id means there's nothing to open, e.g. an import into an organization
    editor.method('picker:project:newProjectConfirmation', (id, importReport = null) => {
        projectId = id;
        report.clear();
        report.hidden = !importReport;
        panel.headerText = importReport ? 'PROJECT IMPORTED' : HEADER;
        confirmationMessage.text = importReport
            ? `Your project is ready. ${importReport.message ?? ''}`.trim()
            : readyText;
        if (importReport) {
            const items = (importReport.items ?? []).slice(0, REPORT_LIMIT);
            const count = importReport.count ?? items.length;
            const more = count - items.length;
            report.append(
                new Label({ class: 'import-report-count', text: `${count} material${count === 1 ? '' : 's'} adjusted` })
            );
            // one row per material: its name, then what changed ("Floor (ID 12): Glossiness 120 → 100.")
            const list = new Container({ dom: 'ul', class: 'import-report-items' });
            items.forEach((item) => {
                const [name, ...change] = String(item).split(': ');
                const li = document.createElement('li');
                const title = document.createElement('span');
                title.className = 'import-report-name';
                title.textContent = change.length ? name : String(item);
                li.appendChild(title);
                if (change.length) {
                    const detail = document.createElement('span');
                    detail.className = 'import-report-change';
                    detail.textContent = change.join(': ');
                    li.appendChild(detail);
                }
                list.dom.appendChild(li);
            });
            report.append(list);
            if (more > 0) {
                report.append(new Label({ text: `${more} more ${more === 1 ? 'item was' : 'items were'} adjusted.` }));
            }
        }
        // opening the new project replaces the current one
        const replace = !!projectId && !backend().multipleProjects;
        if (replace) {
            confirmationMessage.text = replaceText();
        }
        exportButton.hidden = !replace || !backend().projectExport;
        // replacing is destructive, so it confirms as the other deletes do
        openProjectButton.text = replace ? 'Replace project' : 'Open project';
        openProjectButton.class[replace ? 'add' : 'remove']('danger');
        openProjectButton.class[replace ? 'remove' : 'add']('primary');
        openProjectButton.hidden = !projectId;
        continueButton.text = replace ? 'Cancel' : projectId ? 'Not now' : 'Close';
        overlay.hidden = false;
    });
});
