import { Button } from '@playcanvas/pcui';
import type { ButtonArgs } from '@playcanvas/pcui';

type BaseArgs = Omit<ButtonArgs, 'size' | 'text'> & {
    /** `sm` is 26px tall (24px for icon buttons); the default is 32px (28px). */
    size?: 'sm';
};

type TextArgs = BaseArgs & {
    kind: 'primary' | 'secondary' | 'ghost' | 'danger';
    text: string;
    /** Red text on a secondary or ghost button, for destructive actions that aren't the final confirm. */
    tone?: 'danger';
};

type IconArgs = BaseArgs & {
    kind: 'icon';
    /** Read by screen readers and shown as the tooltip. */
    label: string;
};

/**
 * The projects page button: one look per kind, shared by the page, its dialogs and project settings.
 */
export const button = (args: TextArgs | IconArgs) => {
    const { kind, size, class: cls, ...rest } = args;
    const { tone, label, ...pcui } = rest as typeof rest & { tone?: 'danger'; label?: string };

    const btn = new Button({
        ...pcui,
        class: ['pm-button', kind, ...(size ? [size] : []), ...(tone ? [`tone-${tone}`] : []), ...[cls ?? []].flat()]
    });
    if (label) {
        btn.dom.setAttribute('aria-label', label);
        btn.dom.title = label;
    }
    return btn;
};
