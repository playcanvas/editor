editor.once('load', function () {
    'use strict';

    var logos = editor.call('components:logos');

    editor.method('menu:entities:add-component', function () {
        // Create empty menu with sub-menus
        var items = {
            'audio-sub-menu': {
                title: 'Audio',
                icon: logos.sound,
                items: {}
            },
            'ui-sub-menu': {
                title: 'User Interface',
                icon: logos.userinterface,
                items: {}
            },
            'physics-sub-menu': {
                title: 'Physics',
                icon: logos.rigidbody,
                items: {}
            }
        };

        // fill menu with available components
        var components = editor.call('components:schema');
        var list = editor.call('components:list');

        for (let i = 0; i < list.length; i++) {
            var key = list[i];
            var submenu = getSubMenu(key);
            if (submenu) {
                items[submenu].items[key] = makeAddComponentMenuItem(key, components, logos);
            } else {
                items[key] = makeAddComponentMenuItem(key, components, logos);
            }
        }

        // sort alphabetically and add to new object to be returned
        var orderedKeys = Object.keys(items).sort();
        var sorted = {};
        for (let i = 0; i < orderedKeys.length; i++) {
            sorted[orderedKeys[i]] = items[orderedKeys[i]];
        }

        return sorted;
    });

    var getSubMenu = function (key) {
        if (['audiolistener', 'sound'].indexOf(key) >= 0) return 'audio-sub-menu';
        if (['element', 'screen', 'layoutgroup', 'layoutchild', 'button', 'scrollview', 'scrollbar'].indexOf(key) >= 0) return 'ui-sub-menu';
        if (['rigidbody', 'collision'].indexOf(key) >= 0) return 'physics-sub-menu';

        return null;
    };

    // Get Entites on which to apply the result of the context menu
    // If the entity that is clicked on is part of a selection, then the entire
    // selection is returned.
    // Otherwise return just the entity that is clicked on.
    var getSelection = function () {
        var selection = editor.call('selector:items');
        var entity = editor.call('entities:contextmenu:entity');

        if (entity) {
            if (selection.indexOf(entity) !== -1) {
                return selection;
            }
            return [entity];

        }
        return selection;

    };

    var makeAddComponentMenuItem = function (key, components, logos) {
        var data = {
            title: components[key].$title,
            icon: logos[key],
            filter: function () {
                // if any entity in the selection does not have the component
                // then it should be available to add
                var selection = getSelection();
                var name = 'components.' + key;
                for (var i = 0, len = selection.length; i < len; i++) {
                    if (!selection[i].has(name)) {
                        return true;
                    }
                }

                // disable component in menu
                return false;
            },

            select: function () {
                var selection = getSelection();
                editor.call('entities:addComponent', selection, this._value);
            }
        };

        if (key === 'audiosource') {
            data.hide = function () {
                return !editor.call('settings:project').get('useLegacyAudio');
            };
        }

        return data;
    };
});
