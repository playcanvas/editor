import { Button, Container, Label } from '@playcanvas/pcui';

// bars stack in this order whatever order they are shown in
const ORDER = ['scene-size', 'usage', 'notice'] as const;

const bars = new Map<(typeof ORDER)[number], { bar: Container; label: Label }>();

let stack: Container;

/**
 * Shows the alert bar with the given id, creating it on first use, or updates its text if it
 * exists. The bar gets the element id `<id>-alert`.
 *
 * @param id - The bar's id, which also fixes its place in the stack.
 * @param opts - The bar's options.
 * @param opts.tone - The bar's colour.
 * @param opts.text - The bar's text, html when `unsafe` is set.
 * @param opts.unsafe - Whether the text is html. Only read when the bar is created.
 * @param opts.onClose - Called when the user closes the bar. Only read when the bar is created.
 * @returns The bar's label.
 */
export const showAlert = (
    id: (typeof ORDER)[number],
    opts: { tone: 'info' | 'warn' | 'error'; text: string; unsafe?: boolean; onClose?: () => void }
) => {
    let entry = bars.get(id);
    if (!entry) {
        if (!stack) {
            stack = new Container({ id: 'layout-alerts' });
            editor.call('layout.root').append(stack);
        }

        const bar = new Container({ id: `${id}-alert`, class: ['toolbar-alert', `toolbar-alert-${opts.tone}`] });
        const label = new Label({ unsafe: opts.unsafe });
        const close = new Button({ class: 'close', icon: 'E132' });
        close.on('click', () => {
            bar.hidden = true;
            opts.onClose?.();
        });
        bar.append(label);
        bar.append(close);

        const next = ORDER.slice(ORDER.indexOf(id) + 1)
            .map((i) => bars.get(i)?.bar)
            .find((b) => b);
        if (next) {
            stack.appendBefore(bar, next);
        } else {
            stack.append(bar);
        }

        entry = { bar, label };
        bars.set(id, entry);
    }

    entry.label.text = opts.text;
    entry.bar.hidden = false;
    return entry.label;
};

/**
 * Hides the alert bar with the given id, if it was shown.
 *
 * @param id - The bar's id.
 */
export const hideAlert = (id: (typeof ORDER)[number]) => {
    const entry = bars.get(id);
    if (entry) {
        entry.bar.hidden = true;
    }
};
