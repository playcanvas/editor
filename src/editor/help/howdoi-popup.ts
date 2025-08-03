import { Button, Container, Label, Overlay } from '@playcanvas/pcui';

editor.once('load', () => {
    const root = editor.call('layout.root');
    const overlay = new Overlay({
        class: 'help-howdoi',
        hidden: true,
        clickable: true
    });
    root.append(overlay);

    const container = new Container();
    overlay.append(container);

    const content = new Label({
        unsafe: true
    });
    container.append(content);

    const docs = new Button({
        text: 'View Docs',
        class: 'docs',
        hidden: true
    });
    container.append(docs);

    const keyDown = (e) => {
        if (e.key === 'Escape') {
            overlay.hidden = true;
        }
    };

    overlay.on('show', () => {
        editor.emit('help:howdoi:popup:open');
        window.addEventListener('keydown', keyDown);
    });

    overlay.on('hide', () => {
        window.removeEventListener('keydown', keyDown);
        editor.emit('help:howdoi:popup:close');
    });

    editor.method('help:howdoi:popup', (data) => {
        overlay.hidden = false;
        content.text = data.text;

        setTimeout(() => {
            const closeButton = container.innerElement.querySelector('.close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    overlay.hidden = true;
                });
            }
        });
    });
});
