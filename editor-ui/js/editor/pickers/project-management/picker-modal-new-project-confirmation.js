editor.once('load', () => {

    // GLOBAL VARIABLES
    let projectURL;
    const IS_EMPTY_STATE = config.project.id === null;

    // UI

    // overlay
    const root = editor.call('layout.root');
    const overlay = new ui.Overlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-modal-confirmation');
    root.append(overlay);

    // main panel
    const panel = new pcui.Panel({
        headerText: 'CLOSE CURRENT PROJECT',
        class: 'modal-confirmation-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new pcui.Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        returnToCMS();
    });
    panel.header.append(btnClose);

    // confirmation message
    const confirmationMessage = new pcui.Label({
        text: 'Would you like to open your new project or continue working on your current project?'
    });
    panel.append(confirmationMessage);

    // open project button
    const openProjectButton = new pcui.Button({
        class: 'negative-action-button',
        text: IS_EMPTY_STATE ? 'Open New Project' : 'Close Current and Open New Project'
    });
    panel.append(openProjectButton);

    openProjectButton.on('click', () => {
        window.open(projectURL, '_self').focus();
    });

    // continue button
    const continueButton = new pcui.Button({
        class: 'positive-action-button',
        text: IS_EMPTY_STATE ? 'Continue Browsing' : 'Continue with Current Project'
    });
    panel.append(continueButton);

    continueButton.on('click', () => {
        returnToCMS();
    });


    // CONTROLLERS

    // helper method to close current panel and return to CMS
    const returnToCMS = () => {
        overlay.hidden = true;
    };

    // EVENTS

    // load and show data
    overlay.on('show', () => {
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', false);
    });

    // clean up
    overlay.on('hide', () => {
        if (editor.call('viewport:inViewport')) editor.emit('viewport:hover', true);
    });

    // prevent viewport hovering when picker is shown
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // method to display panel
    editor.method('picker:project:newProjectConfirmation', (url) => {
        projectURL = url;
        overlay.hidden = false;
    });

});
