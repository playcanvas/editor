import { THEMES } from '@/core/constants';

import { jsRules } from './tokenizer-rules';

editor.once('load', () => {
    const settings = editor.call('editor:settings');

    const panel = editor.call('layout.code');
    panel.toggleCode = function (toggle: boolean) {
        if (toggle) {
            panel.domContent.classList.remove('invisible');
        } else {
            panel.domContent.classList.add('invisible');
            if (panel.domContent.contains(document.activeElement)) {
                (document.activeElement as HTMLElement).blur();
            }
        }
    };

    const minimapMode = settings.get('ide.minimapMode');

    // create editor
    const monacoEditor = monaco.editor.create(panel.domContent, {
        language: 'javascript',
        tabIndex: 1,
        quickSuggestions: {
            comments: 'on',
            other: 'on',
            strings: 'on'
        },
        fontSize: settings.get('ide.fontSize'),
        autoClosingBrackets: settings.get('ide.autoCloseBrackets'),
        matchBrackets: settings.get('ide.highlightBrackets') ? 'always' : 'never',
        minimap: {
            enabled: minimapMode !== 'none',
            side: minimapMode
        },
        wordWrap: settings.get('ide.wordWrap') ? 'on' : 'off',
        'bracketPairColorization.enabled': settings.get('ide.bracketPairColorization')
    });

    // register editor opener to handle custom types
    monaco.editor.registerEditorOpener({
        openCodeEditor(_: unknown, resource: { path: string }) {
            const uri = monaco.Uri.parse(resource.path);
            const model = monaco.editor.getModel(uri);
            const asset = model && editor.call('view:asset', model.id);
            if (asset) {
                editor.call('files:select', asset.get('id'));
            }
            return !!asset;
        }
    });

    // patches highlighter tokenizer to support jsdoc
    const allLangs = monaco.languages.getLanguages();
    const jsLang = allLangs.find(({ id }) => id === 'javascript');
    jsLang?.loader()?.then(({ language }) => {
        Object.assign(language.tokenizer, jsRules);
    });

    // Setup Themes
    const setMonacoTheme = async (themeName: string) => {
        // fetch theme data and load to monaco
        let data;
        try {
            const res = await fetch(`${config.url.frontend}json/monaco-themes/${THEMES[themeName]}.json`);
            data = await res.json();
        } catch (e) {
            const res = await fetch(`${config.url.frontend}json/monaco-themes/PlayCanvas.json`);
            data = await res.json();
        }

        // define and set for the actual theme
        monaco.editor.defineTheme(themeName, data);
        monaco.editor.setTheme(themeName);

        // create a secondary '-error' theme used for error line highlighting
        const errorData = Object.assign({}, data);
        errorData.colors = Object.assign({}, data.colors);
        errorData.colors['editor.lineHighlightBackground'] = '#fb222f';
        monaco.editor.defineTheme(`${themeName}-error`, errorData);
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
    const typesURL = config.url.engine.replace(/(\.min|\.dbg|\.prf)?\.js$/, '.d.ts');
    fetch(typesURL).then((response) => {
        if (response.ok) {
            response.text().then((code) => {
                monaco.languages.typescript.javascriptDefaults.addExtraLib(code, 'playcanvas.d.ts');
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

    settings.on('ide.minimapMode:set', (value: string) => {
        monacoEditor.updateOptions({
            minimap: {
                enabled: value !== 'none',
                side: value
            }
        });
    });

    settings.on('ide.autoCloseBrackets:set', (value: boolean) => {
        monacoEditor.updateOptions({
            autoClosingBrackets: !!value
        });
    });

    settings.on('ide.highlightBrackets:set', (value: boolean) => {
        monacoEditor.updateOptions({
            matchBrackets: value ? 'always' : 'never'
        });
    });

    settings.on('ide.theme:set', (value: string) => {
        setMonacoTheme(value);
    });

    settings.on('ide.wordWrap:set', (value) => {
        monacoEditor.updateOptions({
            wordWrap: value ? 'on' : 'off'
        });
    });

    settings.on('ide.bracketPairColorization:set', (value: boolean) => {
        // Using quotes in the object looks odd but is considered the official way to set the options
        // https://github.com/microsoft/monaco-editor/blob/main/CHANGELOG.md#0280-22092021

        // We need to apply a 'real' option to apply immediately and then change it back
        // otherwise the user can't see the change
        const matchBrackets = settings.get('ide.highlightBrackets');
        monacoEditor.updateOptions({
            matchBrackets: !matchBrackets ? 'always' : 'never',
            'bracketPairColorization.enabled': value
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

    // expose editor
    editor.method('editor:monaco', () => {
        return monacoEditor;
    });
});
