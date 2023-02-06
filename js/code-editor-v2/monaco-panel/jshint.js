editor.once('load', function () {
    const timeouts = {};
    const errors = {};
    const worker = new Worker('/editor/scene/js/code-editor-v2/monaco-panel/jshint-worker.js');
    const jsViews = new Set();

    // worker message handler
    worker.onmessage = function (evt) {
        if (!evt.data.errors.length) {
            delete errors[evt.data.id];
        } else {
            errors[evt.data.id] = evt.data.errors;
        }

        if (evt.data.id === editor.call('documents:getFocused')) {
            showErrors(evt.data.id);
        }
    };

    // show markers
    function showErrors(id) {
        const errs = errors[id];
        if (!errs) {
            monaco.editor.setModelMarkers(editor.call('views:get', id), null, null);
        } else {
            monaco.editor.setModelMarkers(editor.call('views:get', id), null, errs);
        }
    }

    editor.on('views:new', (id, view, type) => {
        if (type === 'script') {
            jsViews.add(id);
        }
    });

    // when code changes post a message to jshint worker
    // in a timeout
    editor.on('views:change', (id, view) => {
        if (!jsViews.has(id)) return;

        if (timeouts[id]) {
            clearTimeout(timeouts[id]);
        }

        timeouts[id] = setTimeout(() => {
            delete timeouts[id];
            worker.postMessage({
                id: id,
                code: view.getValue()
            });
        }, 500);
    });
});
