editor.once('load', () => {
    // returns all selected entities
    editor.method('entities:selection', () => {
        if (editor.call('selector:type') !== 'entity') {
            return [];
        }

        return editor.call('selector:items').slice(0);
    });

    // returns first selected entity
    editor.method('entities:selectedFirst', () => {
        const selection = editor.call('entities:selection');
        if (selection.length) {
            return selection[0];
        }
        return null;

    });
});
