import { MergeFileEditor } from './merge-file-editor';

editor.once('load', () => {
    if (!editor.call('editor:resolveConflictMode')) {
        return;
    }
    if (config.self.branch.merge.isDiff) {
        return;
    }

    const mergeFileEditor = new MergeFileEditor();
    mergeFileEditor.run();

    /**
     * Gets the number of conflict overlays in the code editor
     */
    editor.method('editor:merge:getNumberOfConflicts', () => {
        return mergeFileEditor.overlayGroups.length;
    });

    /**
     * Returns true if the code editor is dirty
     */
    editor.method('editor:merge:isDirty', () => {
        return mergeFileEditor.isDirty;
    });

    /**
     * Gets the current content of the code editor
     */
    editor.method('editor:merge:getContent', () => {
        return mergeFileEditor.monacoEditor.getValue();
    });

    /**
     * Sets the current content of the code editor
     */
    editor.method('editor:merge:setContent', (value: string) => {
        return mergeFileEditor.monacoEditor.setValue(value);
    });

    /**
     * Moves cursor to the next conflict
     */
    editor.method('editor:merge:goToNextConflict', () => {
        mergeFileEditor.goToNextConflict();
    });

    /**
     * Moves cursor to the previous conflict
     */
    editor.method('editor:merge:goToPrevConflict', () => {
        mergeFileEditor.goToPrevConflict();
    });
});
