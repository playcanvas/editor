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
        text: 'Invalid filename',
        hidden: true
    });
    overlay.append(validate);

    const input = new TextInput({
        blurOnEnter: false,
        keyChange: true
    });
    overlay.append(input);

    const onInputChange = () => {
        validate.hidden = normalizeScriptName(input.value) !== null;
    };

    const onInputKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === 'Enter') {
            const normalizedScriptName = normalizeScriptName(input.value);
            if (normalizedScriptName !== null) {
                callback?.(normalizedScriptName);
                overlay.hidden = true;
            }
        }
    };

    const onWindowKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === 'Escape') {
            evt.stopPropagation();
            overlay.hidden = true;
        }
    };

    const root = editor.call('layout.root');
    root.append(overlay);

    overlay.on('show', () => {
        input.on('change', onInputChange);
        input.on('keydown', onInputKeyDown);
        window.addEventListener('keydown', onWindowKeyDown, true);
    });

    overlay.on('hide', () => {
        input.unbind('change', onInputChange);
        input.unbind('keydown', onInputKeyDown);
        window.removeEventListener('keydown', onWindowKeyDown, true);
        editor.emit('picker:script-create:close');
    });

    editor.method('picker:script-create:validate', normalizeScriptName);

    editor.method('picker:script-create', (fn, string) => {
        callback = fn ?? null;
        overlay.hidden = false;
        validate.hidden = true;
        input.value = string ?? '';
        input.focus(true);
    });

    editor.method('picker:script-create:close', () => {
        overlay.hidden = true;
    });
});
