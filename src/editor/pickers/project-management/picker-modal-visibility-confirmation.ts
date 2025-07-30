import { Panel, Button, Label } from '@playcanvas/pcui';

import { LegacyOverlay } from '../../../common/ui/overlay.ts';

editor.once('load', () => {

    // UI

    // overlay
    const root = editor.call('layout.root');
    const overlay = new LegacyOverlay();
    overlay.clickable = false;
    overlay.hidden = true;
    overlay.class.add('picker-modal-confirmation');
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'CHANGING VISIBILITY',
        class: 'modal-confirmation-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', () => {
        editor.call('picker:project:resetVisibilityToggle');
        returnToCMS();
    });
    panel.header.append(btnClose);

    // confirmation message
    const confirmationMessage = new Label({
        text: ''
    });
    panel.append(confirmationMessage);

    // cancel button
    const cancelButton = new Button({
        class: 'negative-action-button',
        text: 'Cancel'
    });
    panel.append(cancelButton);

    cancelButton.on('click', () => {
        editor.call('picker:project:resetVisibilityToggle');
        returnToCMS();
    });

    // yes button
    const yesButton = new Button({
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
    editor.on('viewport:hover', (state) => {
        if (state && !overlay.hidden) {
            setTimeout(() => {
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
