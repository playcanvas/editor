editor.once('load', () => {
    /**
     * Copies the specified entities into localStorage
     *
     * @param {Observer[]} entities - The entities to copy
     */
    editor.method('entities:copy', (entities) => {
        try {
            editor.api.globals.entities.copyToClipboard(entities.map(e => e.apiEntity));
        } catch (err) {
            if (err.name === 'QuotaExceededError') {
                editor.call('status:error', 'Cannot copy: Selection is too large');
            } else {
                editor.call('status:error', `Copy failed: ${err.message}`);
            }
            console.error('entities:copy error:', err);
        }
    });
});
