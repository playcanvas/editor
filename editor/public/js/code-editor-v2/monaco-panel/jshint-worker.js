importScripts('/editor/scene/js/code-editor-v2/plugins/jshint.js');

// severity codes for monaco
const SEVERITY_ERROR = 8;
const SEVERITY_WARNING = 4;

onmessage = function (evt) {
    if (!evt.data.code || !evt.data.id)
        return;

    // run JSHINT on code
    JSHINT(evt.data.code, {
        esversion: 11
    });

    // report back results in monaco marker format
    this.postMessage({
        id: evt.data.id,
        errors: (JSHINT.data().errors || []).map((e) => {
            return {
                startLineNumber: e.line,
                startColumn: e.character,
                endLineNumber: e.line,
                endColumn: e.character,
                message: e.reason,
                code: e.code,
                severity: e.code.startsWith('E') ? SEVERITY_ERROR : SEVERITY_WARNING
            };
        })
    });
};
