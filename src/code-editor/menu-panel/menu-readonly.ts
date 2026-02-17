import { Label } from '@playcanvas/pcui';

editor.once('load', () => {
    const panel = editor.call('layout.top');

    // readonly label on the top right
    const readonly = new Label({
        class: 'readonly',
        hidden: editor.call('permissions:write'),
        text: 'READ ONLY'
    });
    panel.append(readonly);

    editor.on('editor:readonly:change', (isReadonly: boolean) => {
        readonly.hidden = !isReadonly;
    });
});
