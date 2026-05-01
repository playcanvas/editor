const DEFAULT_LOCALIZATION_DATA = {
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
};

editor.once('load', () => {
    editor.method('assets:create:i18n', (args = {}) => {
        if (!editor.call('permissions:write')) {
            return;
        }

        const parent = (args.parent !== undefined) ? args.parent : editor.call('assets:panel:currentFolder');
        const folder = parent?.apiAsset ?? parent ?? undefined;

        editor.api.globals.assets.createI18n({
            name: 'localization.json',
            localizationData: DEFAULT_LOCALIZATION_DATA,
            folder
        }).catch((err) => {
            editor.call('status:error', err);
        });
    });
});
