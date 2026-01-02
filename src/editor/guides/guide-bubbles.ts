import type { EventHandle } from '@playcanvas/observer';
import { Button, Label, Overlay, Panel } from '@playcanvas/pcui';

import { Bubble } from '@/common/pcui/element/element-bubble';

editor.once('load', () => {
    const root = editor.call('layout.root');

    const overlay = new Overlay({
        clickable: true,
        hidden: true,
        class: 'bubble'
    });
    root.append(overlay);

    const panel = new Panel();
    overlay.append(panel);

    const label = new Label({
        unsafe: true
    });
    panel.append(label);

    const btn = new Button({
        text: 'GOT IT',
        class: 'next'
    });
    btn.on('click', () => {
        overlay.hidden = true;
    });
    overlay.append(btn);

    editor.method('guide:bubble', (title, text, x, y, align, parent) => {
        const bubble = new Bubble();

        if (!parent) {
            parent = root;
        }

        if (parent instanceof Node) {
            parent.appendChild(bubble.dom);
        } else {
            parent.append(bubble);
        }

        bubble.position(x, y);

        let evt: EventHandle | null = null;

        bubble.on('activate', () => {
            const rect = bubble.dom.getBoundingClientRect();

            panel.headerText = title;
            label.text = text;
            overlay.hidden = false;

            overlay.domContent.style.top = `${rect.top}px`;
            overlay.domContent.style.left = `${rect.left}px`;

            overlay.class.add(`arrow-${align}`);

            if (/^bottom/.test(align)) {
                const overlayRect = overlay.domContent.getBoundingClientRect();
                overlay.domContent.style.marginTop = `${-40 - overlayRect.height}px`;
            }

            evt = overlay.once('hide', () => {
                bubble.deactivate();
            });
        });

        bubble.on('deactivate', () => {
            bubble.destroy();
            overlay.hidden = true;
            if (evt) {
                evt.unbind();
                evt = null;
            }
        });

        return bubble;
    });

    overlay.on('show', () => {
        overlay.class.remove('arrow-left');
        overlay.class.remove('arrow-top');
        overlay.class.remove('arrow-top-right');
        overlay.class.remove('arrow-right');
        overlay.class.remove('arrow-bottom');
        overlay.class.remove('arrow-bottom-right');
        overlay.domContent.style.marginTop = '';
    });
});
