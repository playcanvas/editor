editor.once('load', () => {
    const panels = [editor.call('layout.assets'), editor.call('layout.assets.secondary')].filter(Boolean);

    panels.forEach((assetsPanel) => {
        const dropRef = editor.call('drop:target', {
            ref: assetsPanel,
            type: 'files',
            filter: (type: string) => {
                if (type !== 'files' || !editor.call('permissions:write')) {
                    return false;
                }

                return true;
            },
            drop: (type: string, data: FileList | File[]) => {
                if (type !== 'files' || !editor.call('permissions:write')) {
                    return;
                }

                // upload into the folder of the panel the files were dropped on
                editor.call('assets:panel:active', assetsPanel);

                editor.call('assets:upload:files', data);
            }
        });

        dropRef.class.add('assets-drop-area');
    });
});
