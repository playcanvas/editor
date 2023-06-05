import { Panel, Button, Label, Overlay } from '@playcanvas/pcui';

import Markdown from 'markdown-it';
const md = Markdown({});

// MESSAGE BOX - used to display a message to the user and ask for confirmation
// USAGE: editor.call('picker:messageBox', title, message, okText, cancelText, callback);
// title - title of the message box
// message - message to display
// okText - html text to display on the OK button, if it's null, the 'OK' text will be displayed
// cancelText - text to display on the Cancel button. If it's null, the Cancel button will not be displayed
// callback - function to call when the user clicks OK or Cancel. The function will be passed a boolean value indicating whether the user clicked OK or Cancel
editor.once('load', () => {

    // GLOBAL VARIABLES
    let _callback = null;

    // UI

    // overlay
    const overlay = new Overlay({
        clickable: false,
        class: 'picker-message-box',
        hidden: true
    });

    const root = editor.call('layout.root');
    root.append(overlay);

    // main panel
    const panel = new Panel({
        headerText: 'PlayCanvas',
        class: 'modal-confirmation-panel'
    });
    overlay.append(panel);

    // close button
    const btnClose = new Button({
        class: 'close',
        icon: 'E132'
    });
    btnClose.on('click', function () {
        _callback(false);
        overlay.hidden = true;
    });
    panel.header.append(btnClose);

    // confirmation message
    const labelMessage = new Label({
        text: 'Are you sure?'
    });
    panel.append(labelMessage);

    // Positive button
    const btnOK = new Button({
        class: 'positive-action-button',
        text: 'OK'
    });
    panel.append(btnOK);

    btnOK.on('click', () => {
        _callback(true);
        overlay.hidden = true;
    });

    // Negative button
    const btnCancel = new Button({
        class: 'negative-action-button',
        text: 'Cancel'
    });
    panel.append(btnCancel);

    btnCancel.on('click', () => {
        _callback(false);
        overlay.hidden = true;
    });

    // CONTROLLERS

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
    editor.on('viewport:hover', function (state) {
        if (state && !overlay.hidden) {
            setTimeout(function () {
                editor.emit('viewport:hover', false);
            }, 0);
        }
    });

    // method to display panel
    editor.method('picker:messageBox', (title, message, okText, cancelText, callback) => {
        _callback = callback;

        panel.headerText = title;
        const messageHtml = md.render(message);
        labelMessage.dom.innerHTML = messageHtml;
        btnOK.text = okText || 'OK';
        if (cancelText) {
            btnCancel.text = cancelText;
            btnCancel.dom.style.display = 'flex';
        } else {
            btnCancel.dom.style.display = 'none';
        }
        overlay.hidden = false;
    });
});
