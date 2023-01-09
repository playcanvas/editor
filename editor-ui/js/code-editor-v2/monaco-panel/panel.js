editor.once('load', function () {
    'use strict';

    const settings = editor.call('editor:settings');

    const panel = editor.call('layout.code');
    panel.toggleCode = function (toggle) {
        if (toggle) {
            panel.domContent.classList.remove('invisible');
        } else {
            panel.domContent.classList.add('invisible');
        }
    };

    const minimapMode = settings.get('ide.minimapMode');

    // create editor
    const monacoEditor = monaco.editor.create(panel.domContent, {
        language: 'javascript',
        tabIndex: 1,
        fontSize: settings.get('ide.fontSize'),
        autoClosingBrackets: settings.get('ide.autoCloseBrackets'),
        matchBrackets: settings.get('ide.highlightBrackets') ? 'always' : 'never',
        minimap: {
            enabled: minimapMode !== 'none',
            side: minimapMode
        },
        wordWrap: settings.get('ide.wordWrap') ? 'on' : 'off',
        "bracketPairColorization.enabled": settings.get('ide.bracketPairColorization')
    });

    // Setup Themes
    const setMonacoTheme = function (themeName) {
        // fetch theme data and load to monaco
        const themes = editor.call('editor:themes');
        const themeUrl = `/editor/scene/js/monaco-themes/themes/${themes[themeName]}.json`;
        fetch(themeUrl).then(data => data.json()).then((data) => {
            // define and set for the actual theme
            monaco.editor.defineTheme(themeName, data);
            monaco.editor.setTheme(themeName);

            // create a secondary '-error' theme used for error line highlighting
            const errorData = Object.assign({}, data);
            errorData.colors = Object.assign({}, data.colors);
            errorData.colors['editor.lineHighlightBackground'] = '#fb222f';
            monaco.editor.defineTheme(`${themeName}-error`, errorData);
        });
    };
    setMonacoTheme(settings.get('ide.theme'));

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

    // update editor layout when panels (left file panels, or the settings panel) is folded, unfolded, and resized
    // (but wait a bit in a timeout because of the folding / unfolding animation)
    const filesPanel = editor.call('layout.left');
    filesPanel.on('collapse', () => setTimeout(() => onResize(), 120));
    filesPanel.on('expand', () => setTimeout(() => onResize(), 120));
    filesPanel.on('resize', () => onResize());

    const preferencesPanel = editor.call('layout.attributes');
    preferencesPanel.dom.addEventListener('transitionend', () => onResize());
    preferencesPanel.on('resize', () => onResize());

    // update layout once at startup because it seems to break
    // when files panel starts folded
    onResize();

    // add playcanvas typescript definitions
    const playcanvasUrl = config.url.engine.replace(/.js$/, '.d.ts');
    fetch(playcanvasUrl).then((response) => {
        if (response.ok) {
            response.text().then((code) => {
                monaco.languages.typescript.javascriptDefaults.addExtraLib(code, playcanvasUrl);
            });
        }
    });

    // hide initially
    panel.toggleCode(false);

    // subscribe to settings changes
    settings.on('ide.fontSize:set', (value) => {
        monacoEditor.updateOptions({
            fontSize: value
        });
    });

    settings.on('ide.minimapMode:set', (value) => {
        monacoEditor.updateOptions({
            minimap: {
                enabled: value !== 'none',
                side: value
            }
        });
    });

    settings.on('ide.autoCloseBrackets:set', (value) => {
        monacoEditor.updateOptions({
            autoClosingBrackets: !!value
        });
    });

    settings.on('ide.highlightBrackets:set', (value) => {
        monacoEditor.updateOptions({
            matchBrackets: value ? 'always' : 'never'
        });
    });

    settings.on('ide.theme:set', (value) => {
        setMonacoTheme(value);
    });

    settings.on('ide.wordWrap:set', (value) => {
        monacoEditor.updateOptions({
            wordWrap: value ? 'on' : 'off'
        });
    });

    settings.on('ide.bracketPairColorization:set', (value) => {
        // Using quotes in the object looks odd but is considered the official way to set the options
        // https://github.com/microsoft/monaco-editor/blob/main/CHANGELOG.md#0280-22092021

        // We need to apply a 'real' option to apply immediately and then change it back
        // otherwise the user can't see the change
        const matchBrackets = settings.get('ide.highlightBrackets');
        monacoEditor.updateOptions({
            matchBrackets: !matchBrackets ? 'always' : 'never',
            "bracketPairColorization.enabled": value
        });

        setTimeout(() => {
            monacoEditor.updateOptions({
                matchBrackets: matchBrackets ? 'always' : 'never'
            });
        });
    });

    // focus editor when go-to-file closes
    editor.on('picker:fuzzy:close', () => {
        monacoEditor.focus();
    });

    // expose
    editor.method('editor:monaco', () => {
        return monacoEditor;
    });
});
