editor.once('load', () => {

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
        headerText: 'CHANGING VISIBILITY',
        class: 'modal-confirmation-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new pcui.Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        editor.call('picker:project:resetVisibilityToggle');
        returnToCMS();
    });
    panel.header.append(btnClose);

    // confirmation message
    const confirmationMessage = new pcui.Label({
        text: ''
    });
    panel.append(confirmationMessage);

    // cancel button
    const cancelButton = new pcui.Button({
        class: 'negative-action-button',
        text: 'Cancel'
    });
    panel.append(cancelButton);

    cancelButton.on('click', () => {
        editor.call('picker:project:resetVisibilityToggle');
        returnToCMS();
    });

    // yes button
    const yesButton = new pcui.Button({
        class: 'positive-action-button',
        text: 'Yes'
    });
    panel.append(yesButton);

    yesButton.on('click', () => {
        editor.call('picker:project:confirmVisibilityChange');
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
    editor.method('picker:project:changeVisibility', (setting) => {
        overlay.hidden = false;
        confirmationMessage.text = `Are you sure you want to make your project ${setting}`;
    });

});
