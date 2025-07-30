editor.once('load', () => {
    const content = JSON.stringify({
        'header': {
            'version': 1
        },
        'data': [{
            'info': {
                'locale': 'en-US'
            },
            'messages': {
                'key': 'Single key translation',
                'key plural': ['One key translation', 'Translation for {number} keys']
            }
        }]
    }, null, 4);

    editor.method('assets:create:i18n', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const filename = 'Localization.json';

        const asset = {
            name: filename,
            type: 'json',
            source: false,
            parent: editor.call('assets:panel:currentFolder'),
            filename: filename,
            file: new Blob([content], { type: 'application/json' }),
            scope: {
                type: 'project',
                id: config.project.id
            }
        };

        editor.call('assets:create', asset);
    });
});
