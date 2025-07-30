editor.once('load', () => {
    /**
     * Pastes entities in localStore under the specified parent
     *
     * @param {Observer} parent - The parent entity
     */
    editor.method('entities:paste', (parent) => {
        editor.api.globals.entities.pasteFromClipboard(parent ? parent.apiEntity : null);
    });
});
