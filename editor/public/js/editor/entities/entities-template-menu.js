editor.once('load', function () {
    'use strict';

    const templateItems = {};

    // Get Entites on which to apply the result of the context menu
    // If the entity that is clicked on is part of a selection, then the entire
    // selection is returned.
    // Otherwise return just the entity that is clicked on.
    function getSelection() {
        var selection = editor.call('selector:items');
        var entity = editor.call('entities:contextmenu:entity');

        if (entity) {
            if (selection.indexOf(entity) !== -1) {
                return selection;
            }

            return [entity];
        }

        return selection;
    }

    function selectEntity(entity) {
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

    templateItems.new_template = {
        title: 'New Template',
        className: 'menu-item-template',
        icon: '&#57632;',
        filter: function () {
            const selection = getSelection();
            return selection.length === 1 && selection[0].get('parent');
        },
        select: function () {
            editor.call('assets:create:template', getSelection()[0]);
        }
    };

    templateItems.template_apply = {
        title: 'Apply to Template',
        className: 'menu-item-template-apply',
        icon: '&#57651;',
        filter: function () {
            const selection = getSelection();
            return selection.length === 1 && selection[0].get('template_id');
        },
        select: function () {
            editor.call('templates:apply', getSelection()[0]);
        }
    };

    templateItems.template_unlink = {
        title: 'Unlink From Template',
        className: 'menu-item-template-unlink',
        icon: '&#58200;',
        filter: function () {
            const selection = getSelection();
            return selection.length === 1 && selection[0].get('template_id');
        },
        select: function () {
            editor.call('templates:unlink', getSelection()[0]);
        }
    };

    templateItems.template_instance = {
        title: 'Add Instance',
        className: 'menu-item-template-instance',
        icon: '&#57632;',
        filter: function () {
            return getSelection().length === 1;
        },
        select: function () {
            if (!editor.call('permissions:write')) {
                return;
            }

            editor.call('picker:asset', {
                type: 'template'
            });

            let parent = getSelection()[0];
            if (!parent) return;

            var evtPick = editor.once('picker:asset', function (asset) {
                let newEntityId;

                function undo() {
                    const entity = editor.call('entities:get', newEntityId);
                    if (entity) {
                        editor.call('entities:removeEntity', entity);
                    }
                }

                function redo() {
                    if (parent) {
                        parent = parent.latest();
                    }

                    if (!parent) return;

                    const childIndex = parent.get('children').length;
                    editor.call('template:addInstance', asset, parent, { childIndex }, entityId => {
                        newEntityId = entityId;
                        const newEntity = editor.call('entities:get', newEntityId);
                        if (newEntity) {
                            selectEntity(newEntity);
                        }
                    });
                }

                editor.call('history:add', {
                    name: 'add template instance',
                    undo: undo,
                    redo: redo
                });

                redo();
            });

            editor.once('picker:asset:close', function () {
                if (evtPick) {
                    evtPick.unbind();
                    evtPick = null;
                }
            });
        }
    };

    editor.method('menu:entities:template', function () {
        return templateItems;
    });
});
