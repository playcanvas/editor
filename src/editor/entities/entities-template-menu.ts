editor.once('load', () => {
    const templateItems = [];

    // Get Entities on which to apply the result of the context menu
    // If the entity that is clicked on is part of a selection, then the entire
    // selection is returned.
    // Otherwise return just the entity that is clicked on.
    function getSelection() {
        const selection = editor.call('selector:items');
        const entity = editor.call('entities:contextmenu:entity');

        if (entity) {
            if (selection.indexOf(entity) !== -1) {
                return selection;
            }

            return [entity];
        }

        return selection;
    }

    function selectEntity(entity) { // eslint-disable-line no-unused-vars
        // timeout because there is a chance the selector will be disabled
        // when the entity picker is enabled
        setTimeout(() => {
            editor.call('selector:history', false);
            editor.call('selector:set', 'entity', [entity]);
            editor.once('selector:change', () => {
                editor.call('selector:history', true);
            });
        });
    }

    templateItems.push({
        text: 'New Template',
        icon: 'E120',
        onIsEnabled: function () {
            const selection = getSelection();
            return selection.length === 1 && selection[0].get('parent');
        },
        onSelect: function () {
            const entity = getSelection()[0];
            const folder = editor.call('assets:panel:currentFolder');
            editor.api.globals.assets.createTemplate({
                folder: folder && folder.apiAsset,
                entity: entity.apiEntity
            }).catch((err) => {
                const groups = /\d+: (.*)/.exec(err.message);
                if (!groups) {
                    editor.call('status:error', err.message);
                }
                const msg = `Failed to create template: ${groups[1]}`;
                editor.call('console:error', msg, () => {
                    editor.call('selector:set', 'entity', [entity]);
                });
            });

        }
    });

    templateItems.push({
        text: 'Apply to Template',
        icon: 'E133',
        onIsEnabled: function () {
            const selection = getSelection();
            return selection.length === 1 && selection[0].get('template_id');
        },
        onSelect: function () {
            editor.call('templates:apply', getSelection()[0]);
        }
    });

    templateItems.push({
        text: 'Unlink From Template',
        icon: 'E358',
        onIsEnabled: function () {
            const selection = getSelection();
            return selection.length === 1 && selection[0].get('template_id');
        },
        onSelect: function () {
            editor.call('templates:unlink', getSelection()[0]);
        }
    });

    templateItems.push({
        text: 'Add Instance',
        icon: 'E120',
        onIsEnabled: function () {
            return getSelection().length === 1;
        },
        onSelect: function () {
            if (!editor.call('permissions:write')) {
                return;
            }

            editor.call('picker:asset', {
                type: 'template'
            });

            const parent = getSelection()[0];
            if (!parent) {
                return;
            }

            let evtPick = editor.once('picker:asset', (asset) => {
                asset.apiAsset.instantiateTemplate(parent.apiEntity, {
                    select: true,
                    index: parent.get('children').length
                })
                .catch((err) => {
                    editor.call('status:error', err);
                });
            });

            editor.once('picker:asset:close', () => {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }
    });

    editor.method('menu:entities:template', () => {
        return templateItems;
    });
});
