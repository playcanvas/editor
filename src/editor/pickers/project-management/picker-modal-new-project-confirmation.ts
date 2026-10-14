import { Button, Label, Overlay, Panel } from '@playcanvas/pcui';

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
    const confirmationMessage = new Label({
        text: IS_EMPTY_STATE
            ? 'Your new project is ready. Open it now, or keep browsing your projects.'
            : "Your new project is ready. Opening it closes the project you're working on."
    });
    panel.append(confirmationMessage);

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
    editor.method('picker:project:newProjectConfirmation', (projectId) => {
        projectURL = `/editor/project/${projectId}`;
        const params = new URLSearchParams(location.search);
        if (params.has('use_local_frontend')) {
            projectURL += `?use_local_frontend=${params.get('use_local_frontend')}`;
        }
        overlay.hidden = false;
    });
});
