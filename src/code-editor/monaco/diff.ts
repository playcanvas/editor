import { DiffEditor } from './diff-editor';

editor.once('load', () => {
    if (!editor.call('editor:resolveConflictMode')) {
        return;
    }
    if (!config.self.branch.merge.isDiff) {
        return;
    }

    const diffEditor = new DiffEditor();
    diffEditor.run();
});
