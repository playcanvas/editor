editor.once('load', function () {
    'use strict';

    const settings = editor.call('editor:settings');

    const panel = editor.call('layout.code');
    panel.toggleCode = function (toggle) {
        if (toggle) {
            panel.innerElement.classList.remove('invisible');
        } else {
            panel.innerElement.classList.add('invisible');
        }
    };

    // create editor
    const monacoEditor = monaco.editor.create(panel.innerElement, {
        language: 'javascript',
        tabIndex: 1,
        fontSize: settings.get('ide.fontSize'),
        autoClosingBrackets: settings.get('ide.autoCloseBrackets'),
        matchBrackets: settings.get('ide.highlightBrackets') ? 'always' : 'never',
        minimap: {
            enabled: false
        }
    });

    // update editor layout when window is resized
    let resizeTimeout;
    function onResize() {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
            resizeTimeout = null;
            monacoEditor.layout();
        });
    }

    window.addEventListener('resize', onResize);

    // update editor layout when files panel is folded / unfolded
    // (but wait a bit in a timeout because of the folding / unfolding animation)
    const filesPanel = editor.call('layout.left');
    filesPanel.on('fold', () => setTimeout(() => onResize(), 120));
    filesPanel.on('unfold', () => setTimeout(() => onResize(), 120));

    // update layout once at startup because it seems to break
    // when files panel starts folded
    onResize();


    // add playcanvas typescript definitions
    const playcanvasUrl = '/editor/scene/js/engine/playcanvas.d.ts';
    fetch(playcanvasUrl).then(response => {
        if (response.ok) {
            response.text().then(code => {
                monaco.languages.typescript.javascriptDefaults.addExtraLib(code, playcanvasUrl);
            });
        }
    });

    // hide initially
    panel.toggleCode(false);

    // subscribe to settings changes
    settings.on('ide.fontSize:set', function (value) {
        monacoEditor.updateOptions({
            fontSize: value
        });
    });

    settings.on('ide.autoCloseBrackets:set', function (value) {
        monacoEditor.updateOptions({
            autoClosingBrackets: !!value
        });
    });

    settings.on('ide.highlightBrackets:set', function (value) {
        monacoEditor.updateOptions({
            matchBrackets: value ? 'always' : 'never'
        });
    });

    // expose
    editor.method('editor:monaco', function () {
        return monacoEditor;
    });
});
