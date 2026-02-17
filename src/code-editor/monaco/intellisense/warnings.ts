function warn(view: monaco.editor.ITextModel, condition: (view: monaco.editor.ITextModel, code: string) => Iterable<RegExpMatchArray> | null, message: string, owner: string, severity: number = monaco.MarkerSeverity.Warning) {
    const code = view.getValue();
    const markers = [];
    const matches = condition(view, code);

    // Early out if condition not met
    if (!matches) {
        return;
    }

    for (const match of matches) {
        const startPos = view.getPositionAt(match.index);
        const endPos = view.getPositionAt(match.index + match[0].length);

        // Create a marker
        markers.push({
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
            message,
            severity
        });

    }

    monaco.editor.setModelMarkers(view, owner, markers);

}

const markWarning = (ownerKey, condition, message, severity = monaco.MarkerSeverity.Warning) => {

    const onDocumentChange = (_, view) => warn(view, condition, message, ownerKey, severity);

    editor.on('views:new', onDocumentChange);
    editor.on('views:change', onDocumentChange);

};


editor.on('load', () => {

    // Warn when using ScriptType - @see https://github.com/playcanvas/engine/issues/6316
    markWarning(
        'error-cannot-extend-script-type-class',
        (view, code) => view.uri.path.endsWith('.js') && code.matchAll(/extends (ScriptType|pc\.ScriptType)/g),
        'You should not use `ScriptType` with class syntax. Extend the `Script` class instead.'
    );

    // Warn when using dynamic import to import local .mjs modules - @see https://github.com/playcanvas/editor/issues/1169
    markWarning(
        'error-local-dynamic-imports',
        (view, code) => view.uri.path.endsWith('.js') && code.matchAll(/import\([^)]+\)/g),
        'Dynamically importing a relative ".mjs" from a ".js" script is not supported. This may break in production builds.'
    );

});
