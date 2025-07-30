import { COMPONENT_LOGOS } from '../../core/constants.ts';

editor.once('load', () => {
    const getSubMenu = function (key) {
        if (['audiolistener', 'sound'].indexOf(key) >= 0) return 'audio-sub-menu';
        if (['element', 'screen', 'layoutgroup', 'layoutchild', 'button', 'scrollview', 'scrollbar'].indexOf(key) >= 0) return 'ui-sub-menu';
        if (['rigidbody', 'collision'].indexOf(key) >= 0) return 'physics-sub-menu';

        return null;
    };

    // Get Entites on which to apply the result of the context menu
    // If the entity that is clicked on is part of a selection, then the entire
    // selection is returned.
    // Otherwise return just the entity that is clicked on.
    const getSelection = function () {
        const selection = editor.call('selector:items');
        const entity = editor.call('entities:contextmenu:entity');

        if (entity) {
            if (selection.indexOf(entity) !== -1) {
                return selection;
            }
            return [entity];

        }
        return selection;

    };

    const makeAddComponentMenuItem = function (key, components, logos) {
        let title = components[key].$title;
        if (title === 'Model' || title === 'Animation') {
            title += ' (legacy)';
        }
        const data = {
            text: title,
            icon: logos[key],
            onIsEnabled: () => {
                // if any entity in the selection does not have the component
                // then it should be available to add
                const selection = getSelection();
                const name = `components.${key}`;
                for (let i = 0, len = selection.length; i < len; i++) {
                    if (!selection[i].has(name)) {
                        return true;
                    }
                }

                // disable component in menu
                return false;
            },

            onSelect: () => {
                const selection = getSelection();
                editor.call('entities:addComponent', selection, key);
            }
        };

        return data;
    };

    editor.method('menu:entities:add-component', () => {
        // Create empty menu with sub-menus
        const items = {
            'audio-sub-menu': {
                text: 'Audio',
                icon: COMPONENT_LOGOS.sound,
                items: []
            },
            'ui-sub-menu': {
                text: 'User Interface',
                icon: COMPONENT_LOGOS.userinterface,
                items: []
            },
            'physics-sub-menu': {
                text: 'Physics',
                icon: COMPONENT_LOGOS.rigidbody,
                items: []
            }
        };

        // fill menu with available components
        const components = editor.call('components:schema');
        const list = editor.call('components:list');

        for (let i = 0; i < list.length; i++) {
            const key = list[i];
            const submenu = getSubMenu(key);
            if (submenu) {
                items[submenu].items.push(makeAddComponentMenuItem(key, components, COMPONENT_LOGOS));
            } else {
                items[key] = makeAddComponentMenuItem(key, components, COMPONENT_LOGOS);
            }
        }

        // sort alphabetically and add to new object to be returned
        const orderedKeys = Object.keys(items).sort();
        const sorted = [];
        for (let i = 0; i < orderedKeys.length; i++) {
            sorted.push(items[orderedKeys[i]]);
        }

        return sorted;
    });
});
