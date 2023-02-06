editor.once('load', function () {
    /**
     * Pastes entities in localStore under the specified parent
     *
     * @param {Observer} parent - The parent entity
     */
    editor.method('entities:paste', function (parent) {
        editor.entities.pasteFromClipboard(parent ? parent.apiEntity : null);
    });
});
