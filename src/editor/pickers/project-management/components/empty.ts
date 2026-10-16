import { Container, Element, Label } from '@playcanvas/pcui';
import type { Button } from '@playcanvas/pcui';

type EmptyArgs = {
    title: string;
    text?: string;
    /** Class that draws the glyph inside the round icon. */
    icon?: string;
    action?: Button;
    class?: string;
};

/**
 * An empty list: a dashed box with an optional icon, a title, a line of help and one action.
 */
export const empty = ({ title, text, icon, action, class: cls }: EmptyArgs) => {
    const box = new Container({ class: ['pm-empty', ...(cls ? [cls] : [])] });
    if (icon) {
        box.append(new Element({ class: ['pm-empty-icon', icon] }));
    }
    box.append(new Label({ class: 'pm-empty-title', text: title }));
    if (text) {
        box.append(new Label({ class: 'pm-empty-text', text }));
    }
    if (action) {
        box.append(action);
    }
    return box;
};
