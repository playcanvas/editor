import { Button, Container, Label, Overlay, Panel } from '@playcanvas/pcui';

const REPORT_LIMIT = 50;

editor.once('load', () => {
    // GLOBAL VARIABLES
    let projectURL;
    const IS_EMPTY_STATE = config.project.id === null;

    // UI

    // overlay
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-modal-confirmation',
        hidden: true
    });
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: IS_EMPTY_STATE ? 'PROJECT READY' : 'CLOSE CURRENT PROJECT',
        class: 'modal-confirmation-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', () => {
        returnToCMS();
    });
    panel.header.append(btnClose);

    // confirmation message
    const readyText = IS_EMPTY_STATE
        ? 'Your new project is ready. Open it now, or keep browsing your projects.'
        : "Your new project is ready. Opening it closes the project you're working on.";
    const confirmationMessage = new Label({ text: readyText });
    panel.append(confirmationMessage);

    // what an import had to change, e.g. materials it adjusted
    const report = new Container({ class: 'import-report', hidden: true });
    panel.append(report);

    // continue button
    const continueButton = new Button({
        class: 'negative-action-button',
        text: IS_EMPTY_STATE ? 'Keep browsing' : 'Keep working'
    });
    panel.append(continueButton);

    continueButton.on('click', () => {
        returnToCMS();
    });

    // open project button
    const openProjectButton = new Button({
        class: 'positive-action-button',
        text: 'Open project'
    });
    panel.append(openProjectButton);

    openProjectButton.on('click', () => {
        window.open(projectURL, '_self').focus();
    });

    // CONTROLLERS

    // helper method to close current panel and return to CMS
    const returnToCMS = () => {
        overlay.hidden = true;
    };

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', false);
        }
    });

    // clean up
    overlay.on('hide', () => {
        if (editor.call('viewport:inViewport')) {
            editor.emit('viewport:hover', true);
        }
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', (state) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // method to display panel
    // a null project id means there's nothing to open, e.g. an import into an organization
    editor.method('picker:project:newProjectConfirmation', (projectId, importReport = null) => {
        report.clear();
        report.hidden = !importReport;
        confirmationMessage.text = importReport ? 'Imported successfully.' : readyText;
        if (importReport) {
            const items = (importReport.items ?? []).slice(0, REPORT_LIMIT);
            const more = (importReport.count ?? items.length) - items.length;
            report.append(new Label({ class: 'import-report-message', text: importReport.message ?? '' }));
            const list = new Container({ dom: 'ul', class: 'import-report-items' });
            items.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item;
                list.dom.appendChild(li);
            });
            report.append(list);
            if (more > 0) {
                report.append(new Label({ text: `${more} more ${more === 1 ? 'item was' : 'items were'} adjusted.` }));
            }
        }
        openProjectButton.hidden = !projectId;
        continueButton.text = projectId ? (IS_EMPTY_STATE ? 'Keep browsing' : 'Keep working') : 'Close';
        projectURL = `/editor/project/${projectId}`;
        const params = new URLSearchParams(location.search);
        if (params.has('use_local_frontend')) {
            projectURL += `?use_local_frontend=${params.get('use_local_frontend')}`;
        }
        overlay.hidden = false;
    });
});
