editor.once('load', () => {

    const MIN_DELAY = 100;
    const MAX_DELAY = 2000;
    const DEFAULT_DELAY = 500;

    function isCommentLine(lineContent: string) {
        return /^\s*\/\//.test(lineContent);
    }

    let lastAcceptedLineContent = null;
    let lastAcceptedLineNumber = null;

    // Utility function to pause execution for a given duration
    function waitMs(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    function injectCursorMarker(code: string, position: { lineNumber: number; column: number }) {
        const lines = code.split('\n');
        const line = lines[position.lineNumber - 1];
        lines[position.lineNumber - 1] = `${line.slice(0, position.column - 1)}<|CURSOR|>${line.slice(position.column - 1)}`;
        return lines.join('\n');
    }

    monaco.languages.registerInlineCompletionsProvider('javascript', {
        provideInlineCompletions: async (model, position, context, token) => {

            // Check if the user is logged in and has access to the autopilot
            const flags = config.self.flags;
            if (!flags || !(flags.hasAutocomplete || flags.superUser)) {
                return { items: [] };
            }

            const settings = editor.call('editor:settings');

            let delayMs = settings.get('editor.ai.autocompleteDelay');
            if (delayMs < MIN_DELAY || delayMs > MAX_DELAY) {
                delayMs = DEFAULT_DELAY;
            }
            // Check if autocomplete is enabled
            const enabled = settings.get('editor.ai.autocompleteEnabled');
            if (!enabled) {
                return;
            }
            // Get the line content
            const lineContent = model.getLineContent(position.lineNumber);

            // Suppress if line is already completed with previous AI suggestion
            if (lastAcceptedLineNumber === position.lineNumber &&
                lastAcceptedLineContent &&
                lineContent.trim() === lastAcceptedLineContent.trim()) {
                return { items: [] };
            }

            // Suppress if the line is empty
            if (lineContent.length === 0) {
                return { items: [] };
            }

            // Trigger if cursor is after last non-whitespace character
            const trimmedLength = lineContent.trimEnd().length;

            if (position.column <= trimmedLength + 1) {
                return { items: [] };
            }

            // Introduce a delay
            await waitMs(delayMs);

            // Check if the operation has been canceled during the wait
            if (token.isCancellationRequested) {
                return { items: [] };
            }

            const isComment = isCommentLine(lineContent);

            const fullCode = model.getValue();
            const codeWithCursor = injectCursorMarker(fullCode, position);

            const response = await fetch('/api/ai/autocomplete', {
                method: 'POST',
                body: JSON.stringify({ code: codeWithCursor, position, comment: isComment }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return { items: [] };
            }

            const { result } = await response.json();

            // Store suggestion for later comparison
            // eslint-disable-next-line require-atomic-updates
            lastAcceptedLineContent = result;
            // eslint-disable-next-line require-atomic-updates
            lastAcceptedLineNumber = position.lineNumber;

            return {
                items: [{
                    insertText: result,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column
                    }
                }]
            };
        },

        freeInlineCompletions: (_completions: unknown) => {
            // Clean up if needed (e.g., release server-side resources)
        }
    });
});
