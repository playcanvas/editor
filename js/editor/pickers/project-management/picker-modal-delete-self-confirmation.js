import { Panel, Button, Label } from '@playcanvas/pcui';

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
    const panel = new Panel({
        headerText: 'LEAVING PROJECT',
        class: 'modal-confirmation-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        returnToCMS();
    });
    panel.header.append(btnClose);

    // confirmation message
    const confirmationMessage = new Label({
        text: 'Are you sure you want to remove yourself from the project?'
    });
    panel.append(confirmationMessage);

    // stay button
    const stayButton = new Button({
        class: 'negative-action-button',
        text: 'Stay'
    });
    panel.append(stayButton);

    stayButton.on('click', () => {
        returnToCMS();
    });

    // leave button
    const leaveButton = new Button({
        class: 'positive-action-button',
        text: 'Leave Project'
    });
    panel.append(leaveButton);

    leaveButton.on('click', () => {
        editor.call('picker:team:management:removeSelf');
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
    editor.method('picker:project:deleteSelfConfirmation', () => {
        overlay.hidden = false;
    });

});
