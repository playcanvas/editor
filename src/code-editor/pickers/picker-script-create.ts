import { Label, Overlay, TextInput } from '@playcanvas/pcui';

import { normalizeScriptName } from '@/common/script-names';

editor.once('load', () => {
    let callback: ((name: string) => void) | null = null;

    const overlay = new Overlay({
        class: 'picker-script-create',
        clickable: true,
        hidden: true
    });

    const label = new Label({
        text: 'Enter script filename:'
    });
    overlay.append(label);

    const validate = new Label({
        class: 'validate',
        text: 'Invalid filename'
    });
    overlay.append(validate);

    const input = new TextInput({
        blurOnEnter: false
    });
    overlay.append(input);

    input.dom.addEventListener('keydown', (evt) => {
        if (overlay.hidden) {
            return;
        }

        if (evt.key === 'Enter') {
            const normalizedScriptName = normalizeScriptName(input.value);
            if (normalizedScriptName === null) {
                validate.hidden = false;
            } else {
                validate.hidden = true;
                callback?.(normalizedScriptName);
                overlay.hidden = true;
            }
        } else if (evt.key === 'Escape') {
            evt.stopPropagation();
            overlay.hidden = true;
        }
    });

    const root = editor.call('layout.root');
    root.append(overlay);

    overlay.on('hide', () => {
        editor.emit('picker:script-create:close');
    });

    editor.method('picker:script-create:validate', normalizeScriptName);

    editor.method('picker:script-create', (fn, string) => {
        callback = fn || null;
        overlay.hidden = false;
        validate.hidden = true;
        input.value = string || '';
        input.focus(true);
    });

    editor.method('picker:script-create:close', () => {
        overlay.hidden = true;
    });
});
