import { Label } from '@playcanvas/pcui';

import { button } from './components/button';
import { dialog } from './components/dialog';

editor.once('load', () => {
    // UI

    const { overlay, panel, close, footer } = dialog({
        title: 'Changing visibility',
        class: 'picker-modal-confirmation',
        confirm: true
    });

    // closing without confirming puts the toggle back
    const cancel = () => {
        editor.call('picker:project:resetVisibilityToggle');
        overlay.hidden = true;
    };
    close.on('click', cancel);

    const confirmationMessage = new Label({ text: '' });
    panel.append(confirmationMessage);

    const cancelButton = button({ kind: 'secondary', text: 'Cancel' });
    cancelButton.on('click', cancel);
    footer.append(cancelButton);

    const yesButton = button({ kind: 'primary', text: 'Yes' });
    yesButton.on('click', () => {
        editor.call('picker:project:confirmVisibilityChange');
        overlay.hidden = true;
    });
    footer.append(yesButton);

    // method to display panel
    editor.method('picker:project:changeVisibility', (setting) => {
        overlay.hidden = false;
        confirmationMessage.text = `Are you sure you want to make your project ${setting}`;
    });
});
