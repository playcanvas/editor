import { Label, Overlay, TextInput } from '@playcanvas/pcui';

import { normalizeScriptName } from '@/common/script-names';

const INVALID_FILENAME = 'Invalid filename';

editor.once('load', () => {
    let callback: ((name: string) => void) | null = null;
    let extraValidate: ((filename: string) => string | null) | null = null;

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
        text: INVALID_FILENAME,
        hidden: true
    });
    overlay.append(validate);

    const input = new TextInput({
        blurOnEnter: false,
        keyChange: true
    });
    overlay.append(input);

    // run the two checks in order; return the resolved name or an error message
    const evaluate = (raw: string): { name: string | null; error: string | null } => {
        const name = normalizeScriptName(raw);
        if (name === null) {
            return { name: null, error: INVALID_FILENAME };
        }
        const extra = extraValidate?.(name) ?? null;
        return { name, error: extra };
    };

    const onInputChange = () => {
        // empty input is the "neutral" state — show no error until the user types
        if (!input.value) {
            validate.hidden = true;
            return;
        }
        const { error } = evaluate(input.value);
        if (error) {
            validate.text = error;
            validate.hidden = false;
        } else {
            validate.hidden = true;
        }
    };

    const onInputKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === 'Enter') {
            if (!input.value) {
                return;
            }
            const { name, error } = evaluate(input.value);
            if (error) {
                validate.text = error;
                validate.hidden = false;
                return;
            }
            if (name !== null) {
                callback?.(name);
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
        extraValidate = null;
        validate.text = INVALID_FILENAME;
        validate.hidden = true;
        editor.emit('picker:script-create:close');
    });

    editor.method('picker:script-create:validate', normalizeScriptName);

    editor.method('picker:script-create', (fn, string, validator) => {
        callback = fn ?? null;
        extraValidate = validator ?? null;
        overlay.hidden = false;
        validate.text = INVALID_FILENAME;
        validate.hidden = true;
        input.value = string ?? '';
        // surface validation immediately for any seeded value so the user sees a colliding seed
        if (input.value) {
            onInputChange();
        }
        input.focus(true);
    });

    editor.method('picker:script-create:close', () => {
        overlay.hidden = true;
    });
});
