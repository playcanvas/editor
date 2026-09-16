editor.once('load', () => {
    const pending = new Set(['entities:load', 'assets:load', 'realtime:authenticated']);

    const mark = (name: string) => {
        pending.delete(name);
        if (pending.size) {
            return;
        }
        document.body.classList.add('editor-ready');
        editor.method('editor:ready', () => true);
    };

    for (const name of pending) {
        editor.once(name, () => mark(name));
    }
});
