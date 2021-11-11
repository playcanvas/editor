(function () {
    'use strict';

    const dark = '#1d292c';
    const text = '#ffffff';
    const string = '#f1c40f';
    const error = '#fb222f';

    const data = {
        base: 'vs-dark',
        inherit: true,
        rules: [{
            foreground: text
        }, {
            token: 'string', foreground: string
        }],
        colors: {
            'editor.background': dark
        }
    };

    monaco.editor.defineTheme('playcanvas', data);
    monaco.editor.setTheme('playcanvas');

    const errorData = Object.assign({}, data);
    errorData.colors = Object.assign({}, data.colors);
    errorData.colors['editor.lineHighlightBackground'] = error;
    monaco.editor.defineTheme('playcanvas-error', errorData);
})();
