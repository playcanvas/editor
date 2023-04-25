editor.once('load', function () {
    const inResolveConflictMode = !!(config.self.branch.merge && config.self.branch.merge.conflict);

    if (inResolveConflictMode) {
        const root = editor.call('layout.root');
        root.class.add('file-only-mode');
    }

    editor.method('editor:resolveConflictMode', () => {
        return inResolveConflictMode;
    });
});
