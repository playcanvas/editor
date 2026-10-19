import { Label } from '@playcanvas/pcui';

import { button } from './components/button';
import { dialog } from './components/dialog';

editor.once('load', () => {
    // UI

    const { overlay, panel, footer } = dialog({
        title: 'Leaving project',
        class: 'picker-modal-confirmation',
        confirm: true
    });

    panel.append(new Label({ text: 'Are you sure you want to remove yourself from the project?' }));

    const stayButton = button({ kind: 'secondary', text: 'Stay' });
    stayButton.on('click', () => {
        overlay.hidden = true;
    });
    footer.append(stayButton);

    const leaveButton = button({ kind: 'danger', text: 'Leave project' });
    leaveButton.on('click', () => {
        editor.call('picker:team:management:removeSelf');
        overlay.hidden = true;
    });
    footer.append(leaveButton);

    // method to display panel
    editor.method('picker:project:deleteSelfConfirmation', () => {
        overlay.hidden = false;
    });
});
