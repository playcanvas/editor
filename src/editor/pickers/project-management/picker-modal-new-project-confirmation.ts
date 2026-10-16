import { Container, Label } from '@playcanvas/pcui';

import { button } from './components/button';
import { dialog } from './components/dialog';
import { openProject } from './tabs';

const REPORT_LIMIT = 50;

editor.once('load', () => {
    // GLOBAL VARIABLES
    let projectId;

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

    // continue button
    const continueButton = button({ kind: 'secondary', text: 'Not now' });
    footer.append(continueButton);

    continueButton.on('click', () => {
        returnToCMS();
    });

    // open project button
    const openProjectButton = button({ kind: 'primary', text: 'Open project' });
    footer.append(openProjectButton);

    openProjectButton.on('click', () => {
        openProject(projectId);
        overlay.hidden = true;
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
        openProjectButton.hidden = !projectId;
        continueButton.text = projectId ? 'Not now' : 'Close';
        overlay.hidden = false;
    });
});
