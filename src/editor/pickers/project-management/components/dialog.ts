import { Container, Overlay, Panel } from '@playcanvas/pcui';

import { button } from './button';

type DialogArgs = {
    title: string;
    /** Class on the overlay, for the dialog's own content styles. */
    class: string;
    /** 480px instead of 440px. */
    wide?: boolean;
    /** Stacks above other dialogs (confirmations). */
    confirm?: boolean;
};

/**
 * The projects page dialog shell: a centred panel with a title, a labelled close button, Esc to close,
 * and a right-aligned footer that always sits below the content.
 */
export const dialog = ({ title, class: cls, wide, confirm }: DialogArgs) => {
    const overlay = new Overlay({
        clickable: false,
        class: ['pm-dialog', cls, ...(wide ? ['wide'] : []), ...(confirm ? ['confirm'] : [])],
        hidden: true
    });
    editor.call('layout.root').append(overlay);

    const panel = new Panel({ headerText: title, class: 'pm-dialog-panel' });
    overlay.append(panel);

    // emits click so a dialog's own close handler (e.g. resetting a toggle) runs for Esc too
    const close = button({ kind: 'icon', size: 'sm', icon: 'E132', label: 'Close', class: 'close' });
    close.on('click', () => {
        overlay.hidden = true;
    });
    panel.header.append(close);

    const footer = new Container({ class: 'pm-dialog-footer' });
    panel.append(footer);

    // capture phase, so the page or project settings underneath don't close on the same press
    const onKeyDown = (e: KeyboardEvent) => {
        const open = document.querySelectorAll('.pcui-overlay.pm-dialog:not(.pcui-hidden)');
        if (e.key !== 'Escape' || open[open.length - 1] !== overlay.dom) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        close.emit('click');
    };

    // an editor-blocking picker while it's up, so hotkeys and the viewport leave it alone
    overlay.on('show', () => {
        window.addEventListener('keydown', onKeyDown, true);
        editor.emit('picker:open', `dialog:${cls}`);
    });
    overlay.on('hide', () => {
        window.removeEventListener('keydown', onKeyDown, true);
        editor.emit('picker:close', `dialog:${cls}`);
    });

    return { overlay, panel, close, footer };
};
