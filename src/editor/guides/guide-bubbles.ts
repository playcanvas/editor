import { Bubble } from '@/common/pcui/element/element-bubble';
import { LegacyButton } from '@/common/ui/button';
import { LegacyLabel } from '@/common/ui/label';
import { LegacyOverlay } from '@/common/ui/overlay';
import { LegacyPanel } from '@/common/ui/panel';

editor.once('load', () => {
    const root = editor.call('layout.root');

    const overlay = new LegacyOverlay();
    overlay.clickable = true;
    overlay.hidden = true;
    overlay.class.add('bubble');
    root.append(overlay);

    const panel = new LegacyPanel();
    overlay.append(panel);

    const label = new LegacyLabel({
        unsafe: true
    });
    label.renderChanges = false;
    panel.append(label);

    const btn = new LegacyButton({
        text: 'GOT IT'
    });
    btn.class.add('next');
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

        let evt;

        bubble.on('activate', () => {
            const rect = bubble.dom.getBoundingClientRect();

            panel.header = title;
            label.text = text;
            overlay.hidden = false;

            overlay.innerElement.style.top = `${rect.top}px`;
            overlay.innerElement.style.left = `${rect.left}px`;

            overlay.class.add(`arrow-${align}`);

            if (/^bottom/.test(align)) {
                const overlayRect = overlay.innerElement.getBoundingClientRect();
                overlay.innerElement.style.marginTop = `${-40 - overlayRect.height}px`;
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
        overlay.innerElement.style.marginTop = '';
    });
});
