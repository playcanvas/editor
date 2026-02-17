import { Overlay, Label, Button, Container } from '@playcanvas/pcui';

editor.on('load', () => {
    let callback = null;

    // overlay
    const overlay = new Overlay({
        class: 'picker-confirm',
        hidden: true
    });

    // fallback container
    const fallbackContainer = new Container({
        class: 'picker-auditor-container',
        hidden: true
    });
    fallbackContainer.append(new Label({
        text: 'No audits found'
    }));
    overlay.append(fallbackContainer);

    // main container
    const mainContainer = new Container({
        class: 'picker-auditor-container'
    });
    overlay.append(mainContainer);

    // cancel
    const btnCancel = new Button({
        class: 'cancel',
        text: 'Cancel'
    });
    btnCancel.on('click', () => {
        overlay.hidden = true;
    });
    overlay.append(btnCancel);

    // action
    const btnAction = new Button({
        class: 'action',
        text: 'Action'
    });
    btnAction.on('click', () => {
        if (callback) {
            callback();
        }
        overlay.hidden = true;
    });
    overlay.append(btnAction);

    const root = editor.call('layout.root');
    root.append(overlay);

    const keyDown = (evt: KeyboardEvent) => {
        if (overlay.hidden) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        if (evt.key === 'Escape') {
            btnCancel.emit('click');
        } else if (evt.key === 'Enter') { // click focused button
            if (document.activeElement === btnCancel.element) {
                if (!btnCancel.disabled) {
                    btnCancel.emit('click');
                }
            } else if (!btnAction.disabled) {
                btnAction.emit('click');
            }
        } else if (evt.key === 'Tab') { // focus yes / no buttons
            if (document.activeElement === btnCancel.element) {
                btnAction.element.focus();
            } else {
                btnCancel.element.focus();
            }
        } else if (evt.key === 'ArrowRight') { // focus right button (Yes)
            btnAction.element.focus();
        } else if (evt.key === 'ArrowLeft') { // focus left button (No)
            btnCancel.element.focus();
        }
    };

    overlay.on('show', () => {
        // editor-blocking picker open
        editor.emit('picker:open', 'auditor');

        window.addEventListener('keydown', keyDown, true);
    });

    // on overlay hide
    overlay.on('hide', () => {
        // editor-blocking picker closed
        editor.emit('picker:close', 'auditor');

        window.removeEventListener('keydown', keyDown, true);
    });

    /**
     * @param fixes - Set of asset ids that have sRGB fixable issues
     * @param conflicts - Set of asset ids that have sRGB conflicts
     * @returns UI element
     */
    const textureUI = (fixes: Set<number>, conflicts: Set<number>): HTMLElement => {
        const root = document.createElement('div');

        const title = document.createElement('div');
        title.classList.add('title');
        title.textContent = 'Texture Audits';
        root.appendChild(title);

        const issues = fixes.size + conflicts.size;
        const description = document.createElement('div');
        description.classList.add('description');
        description.textContent = [
            `The sRGB settings for ${issues} texture${issues === 1 ? ' does not' : 's do not'}`,
            'match their expected value based on their assigned slots in the material.'
        ].join(' ');
        root.appendChild(description);

        const header1 = document.createElement('div');
        header1.classList.add('header');
        header1.textContent = `Fixes: ${fixes.size}`;
        root.appendChild(header1);

        const body1 = document.createElement('div');
        body1.classList.add('body');
        if (fixes.size) {
            body1.textContent = 'These issues can be fixed automatically.';
        } else {
            body1.textContent = 'No fixes found.';
        }
        root.appendChild(body1);

        const header2 = document.createElement('div');
        header2.classList.add('header');
        header2.textContent = `Conflicts: ${conflicts.size}`;
        root.appendChild(header2);

        const body2 = document.createElement('div');
        body2.classList.add('body');
        if (conflicts.size) {
            body2.classList.add('important');
            body2.textContent = 'These issues need be fixed manually. Please refer to the console log for details.';
        } else {
            body2.textContent = 'No conflicts found.';
        }
        root.appendChild(body2);

        const footer = document.createElement('div');
        footer.classList.add('footer');
        root.appendChild(footer);

        const span = document.createElement('span');
        span.textContent = 'For more information on sRGB textures click ';
        footer.appendChild(span);

        const link = document.createElement('a');
        link.href = 'https://developer.playcanvas.com/user-manual/graphics/linear-workflow/textures/';
        link.target = '_blank';
        link.textContent = 'here';
        footer.appendChild(link);

        return root;
    };

    const showTextureAuditor = () => {
        const issues: { fixes: Set<number>, conflicts: Set<number> } = editor.call('assets:srgb:issues');
        if (!issues) {
            return;
        }
        const { fixes, conflicts } = issues;
        if (!fixes || !conflicts || fixes.size + conflicts.size === 0) {
            fallbackContainer.hidden = false;
            mainContainer.hidden = true;

            btnAction.hidden = true;

            btnCancel.hidden = false;
            btnCancel.text = 'OK';

            callback = null;

            overlay.clickable = true;
            overlay.hidden = false;
            return;
        }

        fallbackContainer.hidden = true;
        mainContainer.hidden = false;
        mainContainer.clear();
        mainContainer.append(textureUI(fixes, conflicts));

        btnAction.hidden = fixes.size === 0;
        btnAction.text = 'Fix issues';

        btnCancel.hidden = false;
        btnCancel.text = 'Cancel';

        callback = () => {
            editor.emit('assets:srgb:fixes:apply');
        };

        overlay.clickable = true;
        overlay.hidden = false;
    };

    editor.method('picker:auditor', () => {
        showTextureAuditor();
    });
});
